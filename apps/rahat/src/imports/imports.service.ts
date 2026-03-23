import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { BeneficiaryJobs } from '@rahataid/sdk/beneficiary';
import { SettingsService } from '@rumsan/extensions/settings';
import { PaginatorTypes, PrismaService, paginator } from '@rumsan/prisma';
import { Queue } from 'bull';
import { firstValueFrom } from 'rxjs';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    @InjectQueue(BQUEUE.RAHAT_IMPORT) private readonly importQueue: Queue,
  ) {}

  private async getR2Setting(key: string) {
    const settings = new SettingsService(this.prisma);
    const r2Settings: any = await settings.getSettingsByName('CLOUDFLARE_R2');
    return r2Settings.value[key];
  }

  private async getS3Client(): Promise<S3Client> {
    if (this.s3Client) return this.s3Client;

    const accountId = await this.getR2Setting('R2_ACCOUNT_ID');
    const accessKeyId = await this.getR2Setting('R2_ACCESS_KEY_ID');
    const secretAccessKey = await this.getR2Setting('R2_SECRET_ACCESS_KEY');
    this.bucket = await this.getR2Setting('R2_BUCKET');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });

    return this.s3Client;
  }

  async create(data: {
    fileUrl: string;
    groupName: string;
    groupUUID: string;
    beneficiaryCount: number;
    meta?: Record<string, unknown>;
  }, source?: string) {
    this.logger.log(`Creating import record for group: ${data.groupName}`);

    // 1. Download CSV from the temporary URL
    const response = await firstValueFrom(
      this.httpService.get(data.fileUrl, { responseType: 'arraybuffer' })
    );
    const fileBuffer = Buffer.from(response.data);

    // 2. Generate a new R2 key and upload to our private bucket
    const s3Client = await this.getS3Client();
    const timestamp = Date.now();
    // ${ metadata.groupUUID }_${ timestamp } -${ metadata.groupName }.csv
    const r2Key = `imports/${timestamp}_${data.groupUUID}_${data.groupName}.csv`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: 'text/csv',
      })
    );

    const fileUrl = `${r2Key}`;
    this.logger.log(`Uploaded CSV to R2: ${r2Key}`);

    // 3. Store import record with original request body as meta
    const { meta } = data;
    return this.prisma.beneficiaryImport.create({
      data: {
        r2Key,
        fileUrl,
        groupName: data.groupName,
        groupUUID: data.groupUUID,
        beneficiaryCount: data.beneficiaryCount,
        source: source || null,
        extras: {
          ...meta,
          originalFileUrl: data.fileUrl,
        },
      },
    });
  }

  async list(query?: {
    status?: string;
    source?: string;
    page?: number;
    perPage?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: Record<string, unknown> = {};
    if (query?.status) where.status = query.status;
    if (query?.source === 'unknown') {
      where.source = null;
    } else if (query?.source) {
      where.source = { contains: query.source, mode: 'insensitive' };
    }

    const sortField = query?.sort || 'createdAt';
    const sortOrder = query?.order || 'desc';

    return paginate(this.prisma.beneficiaryImport, {
      where,
      orderBy: { [sortField]: sortOrder },
    }, {
      page: query?.page,
      perPage: query?.perPage,
    });
  }

  async findOne(uuid: string) {
    const record = await this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });

    const s3Client = await this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: record.r2Key,
    });
    const fileUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return { ...record, fileUrl };
  }

  async getFileStream(uuid: string) {
    const record = await this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });

    const s3Client = await this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: record.r2Key,
    });
    const response = await s3Client.send(command);

    const byteArray = await response.Body.transformToByteArray();

    return {
      buffer: Buffer.from(byteArray),
      filename: record.r2Key.split('/').pop(),
    };
  }

  async updateStatus(uuid: string, status: 'NEW' | 'PROCESSING' | 'IMPORTED' | 'FAILED') {
    return this.prisma.beneficiaryImport.update({
      where: { uuid },
      data: { status },
    });
  }

  async startImport(uuid: string) {
    const record = await this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });

    if (record.status !== 'NEW') {
      throw new Error(`Import ${uuid} is not in NEW status (current: ${record.status})`);
    }

    // Update status to PROCESSING
    await this.prisma.beneficiaryImport.update({
      where: { uuid },
      data: { status: 'PROCESSING' },
    });

    // Add job to the import queue
    const job = await this.importQueue.add(BeneficiaryJobs.IMPORT_V2, {
      importUuid: uuid,
    }, {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    });

    // Store jobId in extras for progress tracking
    const currentExtras = (record.extras as Record<string, any>) || {};
    await this.prisma.beneficiaryImport.update({
      where: { uuid },
      data: {
        extras: { ...currentExtras, jobId: job.id },
      },
    });

    this.logger.log(`Import job ${job.id} queued for import ${uuid}`);
    return { jobId: job.id, status: 'PROCESSING' };
  }

  async getProgress(uuid: string) {
    const record = await this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });

    const extras = (record.extras as Record<string, any>) || {};
    const jobId = extras.jobId;

    if (!jobId) {
      return {
        phase: record.status === 'NEW' ? 'pending' : record.status.toLowerCase(),
        percent: 0,
        total: record.beneficiaryCount,
        processed: 0,
        errors: extras.errors || [],
      };
    }

    const job = await this.importQueue.getJob(jobId);
    if (!job) {
      return {
        phase: record.status.toLowerCase(),
        percent: record.status === 'IMPORTED' ? 100 : 0,
        total: record.beneficiaryCount,
        processed: 0,
        errors: extras.errors || [],
      };
    }

    const progress = job.progress() || {};
    return {
      phase: progress.phase || record.status.toLowerCase(),
      percent: progress.percent || 0,
      total: progress.total || record.beneficiaryCount,
      processed: progress.processed || 0,
      errors: progress.errors || extras.errors || [],
      hasErrorFile: progress.hasErrorFile || !!extras.errorFileR2Key,
    };
  }

  async getErrorFile(uuid: string) {
    const record = await this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });

    const extras = (record.extras as Record<string, any>) || {};
    const errorFileR2Key = extras.errorFileR2Key;

    if (!errorFileR2Key) {
      throw new NotFoundException(`No error file found for import ${uuid}`);
    }

    const s3Client = await this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: errorFileR2Key,
    });
    const response = await s3Client.send(command);
    const byteArray = await response.Body.transformToByteArray();

    return {
      buffer: Buffer.from(byteArray),
      filename: errorFileR2Key.split('/').pop(),
    };
  }

  async uploadErrorFile(uuid: string, errorBuffer: Buffer) {
    const s3Client = await this.getS3Client();
    const r2Key = `imports/${uuid}_errors.csv`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: r2Key,
        Body: errorBuffer,
        ContentType: 'text/csv',
      })
    );
    return r2Key;
  }

  async updateExtras(uuid: string, extras: Record<string, any>) {
    const record = await this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });
    const currentExtras = (record.extras as Record<string, any>) || {};
    return this.prisma.beneficiaryImport.update({
      where: { uuid },
      data: {
        extras: { ...currentExtras, ...extras },
      },
    });
  }
}
