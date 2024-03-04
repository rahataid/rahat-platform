import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { Beneficiary } from '@prisma/client';
import {
  AddToProjectDto,
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
} from '@rahataid/extensions';
import { PrismaService } from '@rumsan/prisma';
import { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { APP, EVENTS } from '../constants';
import { ReferBeneficiaryDto } from './dto/refer.beneficiary.dto';
import { createListQuery } from './helpers';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class BeneficiaryService {
  private rsprisma;
  constructor(
    protected prisma: PrismaService,
    @Inject('PROJECT_CLIENT') private readonly client: ClientProxy,
    private eventEmitter: EventEmitter2
  ) {
    this.rsprisma = this.prisma.rsclient;
  }

  addToProject(dto: AddToProjectDto) {
    return this.prisma.beneficiaryProject.create({
      data: dto,
    });
  }
  // async get(uuid: UUID): TBeneficiary {
  //   const beneficiary = await this.prisma.beneficiary.findUnique({
  //     where: {
  //       uuid,
  //     },
  //   });

  //   const piiData: TPIIData = await this.prisma.beneficiaryPii.findUnique({
  //     where: {
  //       beneficiaryId: beneficiary.id,
  //     },
  //   });

  //   return { piiData, ...beneficiary };
  // }

  async list(
    dto: ListBeneficiaryDto
  ): Promise<PaginatorTypes.PaginatedResult<Beneficiary>> {
    const AND_QUERY = createListQuery(dto);
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    return paginate(
      this.prisma.beneficiary,
      {
        where: {
          //AND: AND_QUERY,
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

  async create(dto: CreateBeneficiaryDto) {
    const { piiData, ...data } = dto;
    const rdata = await this.rsprisma.beneficiary.create({
      data,
    });
    if (piiData) {
      await this.prisma.beneficiaryPii.create({
        data: {
          beneficiaryId: rdata.id,
          ...piiData,
        },
      });
    }
    this.eventEmitter.emit(EVENTS.BENEFICIARY_CREATED);
    return rdata;
  }

  async findOne(uuid: string) {
    return await this.rsprisma.beneficiary.findUnique({ where: { uuid } });
  }

  async referBeneficiary(dto: ReferBeneficiaryDto) {
    const { referrerBeneficiary, referrerVendor, ...rest } = dto;
    const row = await this.create(rest);
    const projectPayload = {
      uuid: row.uuid,
      referrerVendor: referrerVendor || '',
      referrerBeneficiary: referrerBeneficiary || '',
      walletAddress: dto.walletAddress,
      extras: dto?.extras || null,
      type: APP.BENEFICIARY.TYPES.REFERRED,
    };

    return this.client.send({ cmd: 'ben-referred' }, projectPayload);
  }

  // async createBulk(data: CreateBeneficiaryDto[]) {
  //   if (!data.length) return;
  //   const sanitized = data.map((d) => {
  //     return {
  //       ...d,
  //       walletAddress: Buffer.from(d.walletAddress.slice(2), 'hex'),
  //     };
  //   });
  //   return this.rsprisma.beneficiary.createMany({
  //     data: sanitized,
  //   });
  // }

  async update(uuid: UUID, dto: any) {
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

  async remove(uuid: UUID) {
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
      data: {
        deletedAt: new Date(),
      },
    });
    this.eventEmitter.emit(EVENTS.BENEFICIARY_REMOVED);
    return rdata;
  }

  async createBulk(dtos: CreateBeneficiaryDto[]) {
    // Pre-generate UUIDs for each beneficiary to use as a linking key
    dtos.forEach((dto) => {
      dto.uuid = dto.uuid || uuidv4(); // Assuming generateUuid() is a method that generates unique UUIDs
    });

    // Separate PII data and prepare beneficiary data for bulk insertion
    const beneficiariesData = dtos.map(({ piiData, ...data }) => data);
    const piiDataList = dtos.map(({ uuid, piiData }) => ({
      ...piiData,
      uuid, // Temporarily store the uuid with PII data for linking
    }));

    // Insert beneficiaries in bulk
    await this.prisma.beneficiary.createMany({
      data: beneficiariesData,
    });

    // Assuming PII data includes a uuid field for linking purposes
    // Retrieve all just inserted beneficiaries by their uuids to link them with their PII data
    const insertedBeneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        uuid: {
          in: dtos.map((dto) => dto.uuid),
        },
      },
    });

    // Prepare PII data for bulk insertion with correct beneficiaryId
    const piiBulkInsertData = piiDataList.map((piiData) => {
      const beneficiary = insertedBeneficiaries.find(
        (b) => b.uuid === piiData.uuid
      );
      return {
        beneficiaryId: beneficiary.id,
        ...piiData,
        uuid: undefined, // Remove the temporary uuid field
      };
    });

    // Insert PII data in bulk
    if (piiBulkInsertData.length > 0) {
      const sanitizedPiiBenef = piiBulkInsertData.map((b) => {
        return {
          ...b,
          phone: b.phone ? b.phone.toString() : null,
        };
      });
      await this.prisma.beneficiaryPii.createMany({
        data: sanitizedPiiBenef,
      });
    }

    this.eventEmitter.emit(EVENTS.BENEFICIARY_CREATED);

    // Return some form of success indicator, as createMany does not return the records themselves
    return { success: true, count: dtos.length };
  }
}
