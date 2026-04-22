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
import { validateHttpsUrl } from '../utils';
import {
  ALLOWED_SORT_FIELDS,
  CLOUDFLARE_R2_SETTING_NAME,
  DEFAULT_PER_PAGE,
  MAX_GROUP_NAME_LENGTH,
  R2_IMPORTS_PREFIX,
  SIGNED_URL_EXPIRY_SECONDS,
} from './imports.constants';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: DEFAULT_PER_PAGE });

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private s3Client: S3Client;
  private r2Config: R2Config;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly httpService: HttpService,
    @InjectQueue(BQUEUE.RAHAT_IMPORT) private readonly importQueue: Queue,
  ) {}

  private async getR2Config(): Promise<R2Config> {
    if (this.r2Config) return this.r2Config;

    const r2Settings: any = await this.settingsService.getSettingsByName(CLOUDFLARE_R2_SETTING_NAME);
    const v = r2Settings.value;
    this.r2Config = {
      accountId: v.R2_ACCOUNT_ID,
      accessKeyId: v.R2_ACCESS_KEY_ID,
      secretAccessKey: v.R2_SECRET_ACCESS_KEY,
      bucket: v.R2_BUCKET,
    };
    return this.r2Config;
  }

  private async getS3Client(): Promise<S3Client> {
    if (this.s3Client) return this.s3Client;

    const { accountId, accessKeyId, secretAccessKey } = await this.getR2Config();
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

    // 1. Validate the URL to prevent SSRF before downloading
    await validateHttpsUrl(data.fileUrl);

    // 2. Download CSV from the temporary URL
    const response = await firstValueFrom(
      this.httpService.get(data.fileUrl, { responseType: 'arraybuffer' })
    );
    const fileBuffer = Buffer.from(response.data);

    // 3. Generate a new R2 key and upload to our private bucket
    const [s3Client, { bucket }] = await Promise.all([this.getS3Client(), this.getR2Config()]);
    const timestamp = Date.now();
    const safeGroupName = data.groupName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, MAX_GROUP_NAME_LENGTH) || 'group';
    const r2Key = `${R2_IMPORTS_PREFIX}${timestamp}_${data.groupUUID}_${safeGroupName}.csv`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: 'text/csv',
      })
    );

    const fileUrl = `${r2Key}`;
    this.logger.log(`Uploaded CSV to R2: ${r2Key}`);

    // 4. Store import record with original request body as meta
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

    const sortField = ALLOWED_SORT_FIELDS[query?.sort ?? ''] ?? 'createdAt';
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

    const [s3Client, { bucket }] = await Promise.all([this.getS3Client(), this.getR2Config()]);
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: record.r2Key,
    });
    const fileUrl = await getSignedUrl(s3Client, command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });

    return { ...record, fileUrl };
  }

  async getFileStream(uuid: string) {
    const record = await this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });

    const [s3Client, { bucket }] = await Promise.all([this.getS3Client(), this.getR2Config()]);
    const command = new GetObjectCommand({
      Bucket: bucket,
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

    const [s3Client, { bucket }] = await Promise.all([this.getS3Client(), this.getR2Config()]);
    const command = new GetObjectCommand({
      Bucket: bucket,
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
    const [s3Client, { bucket }] = await Promise.all([this.getS3Client(), this.getR2Config()]);
    const r2Key = `${R2_IMPORTS_PREFIX}${uuid}_errors.csv`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
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
