import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { Beneficiary } from '@prisma/client';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { PrismaService } from '@rumsan/prisma';
import { UUID } from 'crypto';
import { EVENTS } from '../constants';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class BeneficiaryService {
  private rsprisma;
  constructor(
    protected prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {
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
          deletedAt: null,
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
    const rdata = await this.rsprisma.beneficiary.create({
      data,
    });
    this.eventEmitter.emit(EVENTS.BENEFICIARY_CREATED);
    return rdata;
  }

  async createBulk(data: CreateBeneficiaryDto[]) {
    const rdata = await this.rsprisma.beneficiary.createMany({
      data,
    });
    this.eventEmitter.emit(EVENTS.BENEFICIARY_CREATED);
    return rdata;
  }

  async update(uuid: UUID, dto: UpdateBeneficiaryDto) {
    const findUuid = await this.prisma.beneficiary.findUnique({
      where: {
        uuid,
      },
    });

    if (!findUuid) throw new Error('Data not Found');

    const rdata = await this.prisma.beneficiary.update({
      where: {
        uuid,
      },
      data: dto,
    });
    this.eventEmitter.emit(EVENTS.BENEFICIARY_UPDATED);
    return rdata;
  }
}
