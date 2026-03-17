import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';

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
  }) {
    this.logger.log(`Creating import record for group: ${data.groupName}`);

    // 1. Download CSV from the temporary URL
    const response = await firstValueFrom(
      this.httpService.get(data.fileUrl, { responseType: 'arraybuffer' })
    );
    const fileBuffer = Buffer.from(response.data);

    // 2. Generate a new R2 key and upload to our private bucket
    const r2Key = `imports/${data.groupUUID}/${randomUUID()}.csv`;
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
        extras: {
          ...meta,
          originalFileUrl: data.fileUrl,
        },
      },
    });
  }

  async list(query?: { status?: string; page?: number; perPage?: number }) {
    const page = query?.page || 1;
    const perPage = query?.perPage || 20;
    const skip = (page - 1) * perPage;

    const where = query?.status ? { status: query.status as any } : {};

    const [data, total] = await Promise.all([
      this.prisma.beneficiaryImport.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.beneficiaryImport.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
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
