import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { Beneficiary } from '@prisma/client';
import {
  AddBenToProjectDto,
  AddToProjectDto,
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  ListProjectBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahataid/extensions';
import {
  BQUEUE,
  BeneficiaryConstants,
  BeneficiaryEvents,
  BeneficiaryJobs,
  ProjectContants,
  TPIIData
} from '@rahataid/sdk';

import { InjectQueue } from '@nestjs/bull';
import { PaginatorTypes, PrismaService, paginator } from '@rumsan/prisma';
import { Queue } from 'bull';
import { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createListQuery } from './helpers';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class BeneficiaryService {
  private rsprisma;
  constructor(
    protected prisma: PrismaService,
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy,
    @InjectQueue(BQUEUE.RAHAT_BENEFICIARY)
    private readonly beneficiaryQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {
    this.rsprisma = this.prisma.rsclient;
  }

  addToProject(dto: AddToProjectDto) {
    return this.prisma.beneficiaryProject.create({
      data: dto,
    });
  }

  listPiiData(dto: any) {
    return paginate(
      this.rsprisma.beneficiaryPii,
      {
        where: {},
      },
      {
        page: dto.page,
        perPage: dto.perPage,
      }
    );
  }

  async listBenefByProject(dto: ListProjectBeneficiaryDto) {
    return paginate(
      this.rsprisma.beneficiaryProject,
      {
        where: {
          projectId: dto.projectId,
        },
        include: { Beneficiary: true },
      },
      {
        page: dto.page,
        perPage: dto.perPage,
      }
    );
  }

  async list(
    dto: ListBeneficiaryDto
  ): Promise<PaginatorTypes.PaginatedResult<Beneficiary>> {
    const AND_QUERY = createListQuery(dto);
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    return paginate(
      this.rsprisma.beneficiary,
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
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
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
    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_CREATED);
    return rdata;
  }

  async findOne(uuid: UUID) {
    const row = await this.rsprisma.beneficiary.findUnique({
      where: { uuid },
    });
    if (!row) return null;
    const piiData = await this.rsprisma.beneficiaryPii.findUnique({
      where: { beneficiaryId: row.id },
    });
    if (piiData) row.piiData = piiData;
    return row;
  }

  async addBeneficiaryToProject(dto: AddBenToProjectDto, projectUid: UUID) {
    const { type, referrerBeneficiary, referrerVendor, ...rest } = dto;
    // 1. Create Beneficiary
    const benef = await this.create(rest);
    const projectPayload = {
      uuid: benef.uuid,
      referrerVendor: referrerVendor || '',
      referrerBeneficiary: referrerBeneficiary || '',
      walletAddress: dto.walletAddress,
      extras: dto?.extras || null,
      type: type || BeneficiaryConstants.Types.ENROLLED,
    };
    // Clear referrer fields if the beneficiary is ENROLLED
    if (type === BeneficiaryConstants.Types.ENROLLED) {
      delete projectPayload.referrerBeneficiary;
      delete projectPayload.referrerVendor;
    }

    // 2. Save Beneficiary to Project
    await this.saveBeneficiaryToProject({
      beneficiaryId: benef.uuid,
      projectId: projectUid,
    });

    // 3. Sync beneficiary to project
    return this.client.send(
      { cmd: BeneficiaryJobs.ADD_TO_PROJECT, uuid: projectUid },
      projectPayload
    );
  }

  async saveBeneficiaryToProject(dto: AddToProjectDto) {
    return this.prisma.beneficiaryProject.create({ data: dto });
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

  async update(uuid: UUID, dto: UpdateBeneficiaryDto) {
    const findUuid = await this.prisma.beneficiary.findUnique({
      where: {
        uuid,
      },
    });

    if (!findUuid) throw new Error('Data not Found');
    const { piiData, ...rest } = dto;

    const rdata = await this.prisma.beneficiary.update({
      where: {
        uuid,
      },
      data: rest,
    });
    if (dto.piiData) await this.updatePIIByBenefUUID(uuid, piiData);
    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_UPDATED);
    return rdata;
  }

  async updatePIIByBenefUUID(benefUUID: UUID, piiData: TPIIData) {
    const beneficiary = await this.findOne(benefUUID);
    if (beneficiary) {
      return this.rsprisma.beneficiaryPii.update({
        where: { beneficiaryId: beneficiary.id },
        data: piiData,
      });
    }
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
    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_REMOVED);
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

    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_CREATED);

    // Return some form of success indicator, as createMany does not return the records themselves
    return { success: true, count: dtos.length };
  }
}
