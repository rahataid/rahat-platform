import { InjectQueue } from '@nestjs/bull';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy, RpcException } from '@nestjs/microservices';
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
  TPIIData,
  generateRandomWallet,
} from '@rahataid/sdk';
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
    private eventEmitter: EventEmitter2
  ) {
    this.rsprisma = this.prisma.rsclient;
  }

  addToProject(dto: AddToProjectDto) {
    return this.prisma.beneficiaryProject.create({
      data: dto,
    });
  }

  async listPiiData(dto: any) {
    if (dto.projectId) {
      const data = await paginate(
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

      if (data.data.length > 0) {
        const mergedData = await this.projectPIIData(data.data);
        data.data = mergedData;
      }
      return data;
    }
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
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    const data = await paginate(
      this.rsprisma.beneficiaryProject,
      {
        where: {
          projectId: dto.projectId,
        },
        include: { Beneficiary: true },
        orderBy
      },
      {
        page: dto.page,
        perPage: dto.perPage,
      }
    );
    // return data;

    if (data.data.length > 0) {
      const mergedData = await this.mergeProjectPIIData(data.data);
      data.data = mergedData;
    }
    const projectPayload = { ...data, status: dto.status };
    // return data;
    return this.client.send(
      { cmd: BeneficiaryJobs.LIST, uuid: dto.projectId },
      projectPayload
    );
  }

  async list(
    dto: ListBeneficiaryDto
  ): Promise<PaginatorTypes.PaginatedResult<Beneficiary>> {
    let result = null as any;
    const AND_QUERY = createListQuery(dto);
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    result = await paginate(
      this.rsprisma.beneficiary,
      {
        where: {
          //AND: AND_QUERY,
          deletedAt: null,
        },
        include: {
          BeneficiaryProject: {
            include: {
              Project: true,
            },
          },
        },
        orderBy,
      },
      {
        page: dto.page,
        perPage: dto.perPage,
      }
    );
    if (result.data.length > 0) {
      const mergedData = await this.mergePIIData(result.data);
      result.data = mergedData;
    }
    return result;
  }

  async mergeProjectPIIData(data: any) {
    let mergedData = [];
    for (let d of data) {
      const piiData = await this.rsprisma.beneficiaryPii.findUnique({
        where: { beneficiaryId: d.Beneficiary.id },
      });
      if (piiData) d.piiData = piiData;
      mergedData.push(d);
    }
    return mergedData;
  }

  async projectPIIData(data: any) {
    let projectPiiData = [];
    for (let d of data) {
      const piiData = await this.rsprisma.beneficiaryPii.findUnique({
        where: { beneficiaryId: d.Beneficiary.id },
      });
      if (piiData) projectPiiData.push(piiData);
    }
    return projectPiiData;
  }

  async mergePIIData(data: any) {
    let mergedData = [];
    for (let d of data) {
      const piiData = await this.rsprisma.beneficiaryPii.findUnique({
        where: { beneficiaryId: d.id },
      });
      if (piiData) d.piiData = piiData;
      mergedData.push(d);
    }
    return mergedData;
  }

  async create(dto: CreateBeneficiaryDto, projectUuid?: string) {
    const { piiData, ...data } = dto;
    if (!data.walletAddress) {
      data.walletAddress = generateRandomWallet().address;
    }
    if (!piiData.phone) throw new RpcException('Phone number is required')
    const benData = await this.rsprisma.beneficiaryPii.findUnique({
      where: {
        phone: piiData.phone
      }
    });
    if (benData) throw new RpcException('Phone number should be unique')
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    const rdata = await this.rsprisma.beneficiary.create({
      data,
    });
    if (piiData) {
      await this.prisma.beneficiaryPii.create({
        data: {
          beneficiaryId: rdata.id,
          phone: piiData.phone ? piiData.phone.toString() : null,
          ...piiData,
        },
      });
    }
    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_CREATED, {
      projectUuid,
    });
    return rdata;
  }

  async findOne(uuid: UUID) {
    const row = await this.rsprisma.beneficiary.findUnique({
      where: { uuid },
      include: {
        BeneficiaryProject: {
          include: {
            Project: true
          }
        }
      }


    });
    if (!row) return null;
    const piiData = await this.rsprisma.beneficiaryPii.findUnique({
      where: { beneficiaryId: row.id },
    });
    if (piiData) row.piiData = piiData;
    return row;
  }

  async findOneByWallet(walletAddress: string) {
    const row = await this.rsprisma.beneficiary.findFirst({
      where: { walletAddress },
      include: {
        BeneficiaryProject: {
          include: {
            Project: true
          }
        }
      }
    });
    if (!row) return null;
    const piiData = await this.rsprisma.beneficiaryPii.findUnique({
      where: { beneficiaryId: row.id },
    });
    if (piiData) row.piiData = piiData;
    return row;
  }

  async findOneByPhone(phone: string) {
    const piiData = await this.rsprisma.beneficiaryPii.findFirst({
      where: { phone },
    });
    if (!piiData) return null;
    const beneficiary = await this.rsprisma.beneficiary.findUnique({
      where: { id: piiData.beneficiaryId },
      include: {
        BeneficiaryProject: {
          include: {
            Project: true
          }
        }
      }
    });
    if (!beneficiary) return null;
    beneficiary.piiData = piiData;
    return beneficiary;
  }

  async addBeneficiaryToProject(dto: AddBenToProjectDto, projectUid: UUID) {
    const { type, referrerBeneficiary, referrerVendor, ...rest } = dto;
    // 1. Create Beneficiary
    const benef = await this.create(rest, projectUid);
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

  async bulkAssignToProject(dto) {
    const { beneficiaryIds, projectId } = dto;
    const projectPayloads = [];
    const benProjectData = [];

    await Promise.all(
      beneficiaryIds.map(async (beneficiaryId) => {
        const beneficiaryData = await this.rsprisma.beneficiary.findUnique({
          where: { uuid: beneficiaryId },
        });
        const projectPayload = {
          uuid: beneficiaryData.uuid,
          walletAddress: beneficiaryData.walletAddress,
          extras: beneficiaryData?.extras || null,
          type: BeneficiaryConstants.Types.ENROLLED,
        };
        benProjectData.push({
          projectId,
          beneficiaryId,
        });
        projectPayloads.push(projectPayload);
      })
    );

    //2.Save beneficiary to project
    await this.prisma.beneficiaryProject.createMany({
      data: benProjectData,
    });

    //3. Sync beneficiary to project

    return this.client.send(
      {
        cmd: BeneficiaryJobs.BULK_ASSIGN_TO_PROJECT,
        uuid: projectId,
      },
      projectPayloads
    );
  }

  async assignBeneficiaryToProject(dto: AddToProjectDto) {
    const { beneficiaryId, projectId } = dto;
    //1. Get beneficiary data
    const beneficiaryData = await this.rsprisma.beneficiary.findUnique({
      where: { uuid: beneficiaryId },
    });
    const projectPayload = {
      uuid: beneficiaryData.uuid,
      walletAddress: beneficiaryData.walletAddress,
      extras: beneficiaryData?.extras || null,
      type: BeneficiaryConstants.Types.ENROLLED,
    };

    //2.Save beneficiary to project

    await this.saveBeneficiaryToProject({
      beneficiaryId: beneficiaryId,
      projectId: projectId,
    });

    //3. Sync beneficiary to project
    return this.client.send(
      { cmd: BeneficiaryJobs.ADD_TO_PROJECT, uuid: projectId },
      projectPayload
    );
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
    console.log('dtos', dtos)
    const hasPhone = dtos.every((dto) => dto.piiData.phone);
    if (!hasPhone)
      throw new RpcException(
        new BadRequestException('Phone number is required!')
      );
    const hasWallet = dtos.every((dto) => dto.walletAddress);
    if (!hasWallet)
      // Pre-generate UUIDs for each beneficiary to use as a linking key
      dtos.forEach((dto) => {
        dto.uuid = dto.uuid || uuidv4(); // Assuming generateUuid() is a method that generates unique UUIDs
        dto.walletAddress = dto.walletAddress || generateRandomWallet().address;
      });

    // Separate PII data and prepare beneficiary data for bulk insertion
    const beneficiariesData = dtos.map(({ piiData, ...data }) => data);
    const piiDataList = dtos.map(({ uuid, piiData }) => ({
      ...piiData,
      uuid, // Temporarily store the uuid with PII data for linking
    }));


    try {
      const created = await this.prisma.beneficiary.createMany({
        data: beneficiariesData,
      });



    } catch (e) {
      throw new RpcException(
        new BadRequestException('Error in creating beneficiaries')
      )
    }
    // Insert beneficiaries in bulk

    // Assuming PII data includes a uuid field for linking purposes
    // Retrieve all just inserted beneficiaries by their uuids to link them with their PII data
    const insertedBeneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        uuid: {
          in: dtos.map((dto) => dto.uuid),
        },
      },
    });

    console.log('insertedBeneficiaries', insertedBeneficiaries)

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

  async listReferredBen({ bendata }) {
    const uuids = bendata.data.map((item) => item.uuid);
    let result = {};
    const newdata = await this.prisma.beneficiary.findMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
    });
    if (newdata.length > 0) {
      const mergedData = await this.mergePIIData(newdata);
      result = mergedData;
    }

    return { result, meta: bendata.meta };
  }

  async getTotalCount({ projectId }) {
    const benTotal = await this.prisma.beneficiaryProject.count({
      where: {
        projectId
      }
    });

    const vendorTotal = await this.prisma.projectVendors.count({
      where: {
        projectId
      }
    })
    return { benTotal, vendorTotal }
  }

  async getProjectSpecificData(data) {
    const { benId, projectId } = data;
    const benData = await this.findOne(benId);
    if (benData) return this.client.send({ cmd: BeneficiaryJobs.GET, uuid: projectId }, { uuid: benId, data: benData });
    return benData
  }
}
