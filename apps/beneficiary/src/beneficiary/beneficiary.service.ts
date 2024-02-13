import { HttpException, Injectable } from '@nestjs/common';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Beneficiary } from '@prisma/client';
import { UUID } from 'crypto';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class BeneficiaryService {
  private rsprisma;
  constructor(protected prisma: PrismaService) {
    this.rsprisma = this.prisma.rsclient;
  }

  async list(
    dto: ListBeneficiaryDto
  ): Promise<PaginatorTypes.PaginatedResult<Beneficiary>> {
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    return paginate(
      this.prisma.beneficiary,
      {
        where: {
          //deletedAt: null,
        },
        orderBy,
      },
      {
        page: dto.page,
        perPage: dto.perPage,
      }
    );
  }

  async create(data: CreateBeneficiaryDto) {
    return this.rsprisma.beneficiary.create({
      data,
    });
  }

  async createBulk(data: CreateBeneficiaryDto[]) {
    return this.rsprisma.beneficiary.createMany({
      data,
    });
  }

  async update(uuid: UUID, dto: UpdateBeneficiaryDto) {
    const findUuid = await this.prisma.beneficiary.findUnique({
      where: {
        uuid,
      },
    });

    if (!findUuid) throw new Error('Data not Found');

    return await this.prisma.beneficiary.update({
      where: {
        uuid,
      },
      data: dto,
    });
  }
}
