import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { BeneficiaryJobs } from '@rahataid/sdk/beneficiary';
import { PrismaService } from '@rumsan/prisma';
import { Job } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { mapCSVRows, MappedRow, parseCSVBuffer } from '../imports/csv-parser.util';
import {
  generateErrorCSV,
  validateAgainstDB,
  validateRows,
  ValidationError,
} from '../imports/import-validator.util';
import { ImportsService } from '../imports/imports.service';
import { WalletService } from '../wallet/wallet.service';

const BATCH_SIZE = 500;
const WALLET_GENERATION_BATCH_SIZE = 100;

@Processor(BQUEUE.RAHAT_IMPORT)
export class ImportProcessor {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly importsService: ImportsService,
    private readonly walletService: WalletService,
  ) { }

  @Process({ name: BeneficiaryJobs.IMPORT_V2, concurrency: 1 })
  async processImport(job: Job<{ importUuid: string }>) {
    const { importUuid } = job.data;
    this.logger.log(`Starting import processing for: ${importUuid}`);

    try {
      // 1. Fetch import record
      const importRecord = await this.prisma.beneficiaryImport.findUniqueOrThrow({
        where: { uuid: importUuid },
      });

      if (importRecord.status !== 'PROCESSING') {
        throw new Error(`Import ${importUuid} is not in PROCESSING status`);
      }

      // 2. Download CSV from R2
      await job.progress({ phase: 'parsing', percent: 5, total: 0, processed: 0 });
      const { buffer } = await this.importsService.getFileStream(importUuid);

      // PHASE 1: PARSING (0% → 30%)
      this.logger.log(`Parsing CSV for import: ${importUuid}`);
      const { rows: originalRows } = parseCSVBuffer(buffer);
      const totalRows = originalRows.length;

      if (totalRows === 0) {
        await this.failImport(importUuid, job, 'CSV file is empty');
        return;
      }

      await job.progress({ phase: 'parsing', percent: 15, total: totalRows, processed: 0 });

      const mappedRows = mapCSVRows(originalRows);
      await job.progress({ phase: 'parsing', percent: 30, total: totalRows, processed: totalRows });
      this.logger.log(`Parsed ${totalRows} rows for import: ${importUuid}`);

      // PHASE 2: VALIDATION (30% → 60%)
      this.logger.log(`Validating rows for import: ${importUuid}`);
      await job.progress({ phase: 'validating', percent: 35, total: totalRows, processed: 0 });

      // 2a. Validate within CSV (required fields, duplicate phones)
      const csvValidation = validateRows(mappedRows, originalRows);
      await job.progress({ phase: 'validating', percent: 45, total: totalRows, processed: 0 });

      // 2b. Validate against DB (phone + walletAddress uniqueness)
      const dbValidation = await validateAgainstDB(mappedRows, originalRows, this.prisma);

      const allErrors: ValidationError[] = [
        ...csvValidation.errors,
        ...dbValidation.errors,
      ];

      if (allErrors.length > 0) {
        this.logger.warn(`Validation failed for import ${importUuid}: ${allErrors.length} errors`);

        // Generate error CSV and upload to R2
        const errorBuffer = generateErrorCSV(allErrors);
        const errorFileR2Key = await this.importsService.uploadErrorFile(importUuid, errorBuffer);

        // Summarize errors (don't store full rowData in extras to avoid bloat)
        const errorSummary = allErrors.map(({ row, field, message }) => ({ row, field, message }));

        await this.importsService.updateExtras(importUuid, {
          errors: errorSummary,
          errorFileR2Key,
          errorCount: allErrors.length,
        });
        await this.importsService.updateStatus(importUuid, 'FAILED');

        await job.progress({
          phase: 'failed',
          percent: 60,
          total: totalRows,
          processed: 0,
          errors: errorSummary,
          hasErrorFile: true,
        });
        return;
      }

      await job.progress({ phase: 'validating', percent: 60, total: totalRows, processed: 0 });
      this.logger.log(`Validation passed for import: ${importUuid}`);

      // PHASE 2.5: WALLET GENERATION (60% → 62%)
      await this.generateWalletsForRows(mappedRows, job, totalRows);

      // PHASE 3: IMPORT (62% → 100%)
      this.logger.log(`Starting bulk import for: ${importUuid}`);
      await job.progress({ phase: 'importing', percent: 62, total: totalRows, processed: 0 });

      await this.executeBulkImport(importUuid, mappedRows, importRecord.groupName, job, totalRows);

      // Success
      await this.importsService.updateExtras(importUuid, {
        importedCount: totalRows,
        completedAt: new Date().toISOString(),
      });

      await job.progress({ phase: 'completed', percent: 100, total: totalRows, processed: totalRows });
      this.logger.log(`Import completed successfully: ${importUuid} (${totalRows} beneficiaries)`);
    } catch (error) {
      this.logger.error(`Import failed for ${importUuid}: ${error.message}`, error.stack);
      await this.failImport(importUuid, job, error.message);
    }
  }

  private async executeBulkImport(
    importUuid: string,
    mappedRows: MappedRow[],
    groupName: string,
    job: Job,
    totalRows: number,
  ) {
    const batches = createBatches(mappedRows, BATCH_SIZE);
    const totalBatches = batches.length;

    await this.prisma.$transaction(
      async (tx) => {
        // 1. Upsert BeneficiaryGroup
        const group = await tx.beneficiaryGroup.upsert({
          where: { name: groupName },
          create: { name: groupName },
          update: {},
        });

        let processedCount = 0;

        // 2. Process each batch
        for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
          const batch = batches[batchIdx];

          // Prepare beneficiary data
          const beneficiaryData = batch.map((row) => ({
            uuid: row.beneficiary.uuid || uuidv4(),
            gender: row.beneficiary.gender || 'UNKNOWN',
            walletAddress: row.beneficiary.walletAddress,
            birthDate: row.beneficiary.birthDate || null,
            age: row.beneficiary.age || null,
            location: row.beneficiary.location || null,
            latitude: row.beneficiary.latitude || null,
            longitude: row.beneficiary.longitude || null,
            extras: Object.keys(row.extras).length > 0 ? row.extras : undefined,
            notes: row.beneficiary.notes || null,
            bankedStatus: row.beneficiary.bankedStatus || 'UNKNOWN',
            internetStatus: row.beneficiary.internetStatus || 'UNKNOWN',
            phoneStatus: row.beneficiary.phoneStatus || 'UNKNOWN',
          }));

          // Insert beneficiaries
          const insertedBeneficiaries = await tx.beneficiary.createManyAndReturn({
            data: beneficiaryData,
            select: { id: true, uuid: true },
          });

          // Prepare and insert PII data
          const piiData = batch.map((row, i) => ({
            beneficiaryId: insertedBeneficiaries[i].id,
            name: row.pii.name || null,
            phone: row.pii.phone,
            email: row.pii.email || null,
            extras: row.pii.extras || undefined,
          }));

          await tx.beneficiaryPii.createMany({ data: piiData });

          // Prepare and insert GroupedBeneficiaries
          const groupedData = insertedBeneficiaries.map((b) => ({
            beneficiaryGroupId: group.uuid,
            beneficiaryId: b.uuid,
          }));

          await tx.groupedBeneficiaries.createMany({ data: groupedData });

          processedCount += batch.length;
          const percent = 62 + Math.round((processedCount / totalRows) * 38);
          await job.progress({
            phase: 'importing',
            percent,
            total: totalRows,
            processed: processedCount,
          });

          this.logger.log(
            `Import ${importUuid}: batch ${batchIdx + 1}/${totalBatches} complete (${processedCount}/${totalRows})`,
          );
        }

        // 3. Update import status within the transaction
        await tx.beneficiaryImport.update({
          where: { uuid: importUuid },
          data: { status: 'IMPORTED' },
        });
      },
      {
        timeout: 120000,
      },
    );
  }

  private async failImport(uuid: string, job: Job, message: string) {
    try {
      await this.importsService.updateStatus(uuid, 'FAILED');
      await this.importsService.updateExtras(uuid, {
        failedAt: new Date().toISOString(),
        failureReason: message,
      });
    } catch (e) {
      this.logger.error(`Failed to update import status: ${e.message}`);
    }

    await job.progress({
      phase: 'failed',
      percent: 0,
      total: 0,
      processed: 0,
      errors: [{ message }],
    });
  }

  private async generateWalletsForRows(
    mappedRows: MappedRow[],
    job: Job,
    totalRows: number
  ): Promise<void> {
    // 1. Identify rows without wallet addresses
    const rowsNeedingWallets = mappedRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !row.beneficiary.walletAddress);

    if (rowsNeedingWallets.length === 0) {
      this.logger.log('All rows have wallet addresses, skipping generation');
      return;
    }

    this.logger.log(`Generating ${rowsNeedingWallets.length} wallets in bulk`);
    await job.progress({
      phase: 'generating_wallets',
      percent: 60,
      total: totalRows,
      processed: 0,
      walletsGenerated: 0,
    });

    // 2. Create batches for progress tracking
    const batches = createBatches(rowsNeedingWallets, WALLET_GENERATION_BATCH_SIZE);
    let walletsGenerated = 0;

    // 3. Process batches sequentially
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];

      try {
        // Use bulk wallet generation from SDK
        const wallets = await this.walletService.createBulk(batch.length);

        // Assign to mappedRows
        batch.forEach(({ index }, i) => {
          mappedRows[index].beneficiary.walletAddress = wallets[i].address;
        });

        walletsGenerated += batch.length;

        // Update progress
        const percent = 60 + Math.round((walletsGenerated / rowsNeedingWallets.length) * 2);
        await job.progress({
          phase: 'generating_wallets',
          percent,
          total: totalRows,
          processed: walletsGenerated,
          walletsGenerated,
          walletBatchesCompleted: batchIdx + 1,
          walletBatchesTotal: batches.length,
        });

        this.logger.log(
          `Generated wallet batch ${batchIdx + 1}/${batches.length} (${walletsGenerated}/${rowsNeedingWallets.length})`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Wallet generation failed for batch ${batchIdx + 1}: ${errorMessage}`);
        throw new Error(`Failed to generate wallets: ${errorMessage}`);
      }
    }

    this.logger.log(`Wallet generation complete: ${walletsGenerated} wallets created`);
  }
}

function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
