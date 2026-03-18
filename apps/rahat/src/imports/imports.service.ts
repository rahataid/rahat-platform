import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PaginatorTypes, PrismaService, paginator } from '@rumsan/prisma';
import { firstValueFrom } from 'rxjs';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService
  ) {
    this.bucket = process.env.R2_BUCKET;
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
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
    const timestamp = Date.now();
    // ${ metadata.groupUUID }_${ timestamp } -${ metadata.groupName }.csv
    const r2Key = `imports/${timestamp}_${data.groupUUID}_${data.groupName}.csv`;
    await this.s3Client.send(
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

  async list(query?: { status?: string; source?: string; page?: number; perPage?: number }) {
    const where: Record<string, unknown> = {};
    if (query?.status) where.status = query.status;
    if (query?.source === 'unknown') {
      where.source = null;
    } else if (query?.source) {
      where.source = { contains: query.source, mode: 'insensitive' };
    }

    return paginate(this.prisma.beneficiaryImport, {
      where,
      orderBy: { createdAt: 'desc' },
    }, {
      page: query?.page,
      perPage: query?.perPage,
    });
  }

  async findOne(uuid: string) {
    return this.prisma.beneficiaryImport.findUniqueOrThrow({
      where: { uuid },
    });
  }

  async updateStatus(uuid: string, status: 'NEW' | 'PROCESSING' | 'IMPORTED' | 'FAILED') {
    return this.prisma.beneficiaryImport.update({
      where: { uuid },
      data: { status },
    });
  }
}
