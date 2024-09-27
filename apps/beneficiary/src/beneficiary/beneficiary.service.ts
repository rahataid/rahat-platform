import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Beneficiary } from '@prisma/client';
import {
  AddBenToProjectDto,
  AddBenfGroupToProjectDto,
  AddToProjectDto,
  CreateBeneficiaryDto,
  CreateBeneficiaryGroupsDto,
  ImportTempBenefDto,
  ListBeneficiaryDto,
  ListBeneficiaryGroupDto,
  ListTempBeneficiariesDto,
  ListTempGroupsDto,
  UpdateBeneficiaryDto,
  UpdateBeneficiaryGroupDto,
  addBulkBeneficiaryToProject
} from '@rahataid/extensions';
import {
  BQUEUE,
  BeneficiaryConstants,
  BeneficiaryEvents,
  BeneficiaryJobs,
  ProjectContants, TPIIData,
  generateRandomWallet
} from '@rahataid/sdk';
import { PaginatorTypes, PrismaService, paginator } from '@rumsan/prisma';
import { Queue } from 'bull';
import { UUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { isAddress } from 'viem';
import { findTempBenefGroups, validateDupicatePhone, validateDupicateWallet } from '../processors/processor.utils';
import { handleMicroserviceCall } from '../utils/handleMicroserviceCall';
import { createListQuery } from './helpers';
import { VerificationService } from './verification.service';

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
    private readonly verificationService: VerificationService
  ) {
    this.rsprisma = this.prisma.rsclient;
  }

  addToProject(dto: AddToProjectDto) {
    return this.prisma.beneficiaryProject.create({
      data: dto,
    });
  }

  async listPiiData(dto: any) {
    const repository = dto.projectId ? this.rsprisma.beneficiaryProject : this.rsprisma.beneficiaryPii;
    const include = dto.projectId ? { Beneficiary: true } : {};
    let where: any = dto.projectId ? { projectId: dto.projectId } : {};

    const startDate = dto.startDate;
    const endDate = dto.endDate;

    if (dto.projectId) {
      if (startDate && endDate) { where.createdAt = { gte: new Date(startDate), lte: new Date(endDate), } }
      if (startDate && !endDate) { where.createdAt = { gte: new Date(startDate) } }
      if (!startDate && endDate) { where.createdAt = { lte: new Date(endDate) } }
    }

    //TODO: change in library to make pagination optional
    const perPage = await repository.count()

    const data = await paginate(
      repository,
      {
        where: where,
        include: include,
      },
      {
        page: dto.page,
        perPage: perPage,
      }
    );

    if (dto.projectId && data.data.length) {
      const mergedData = await this.mergeProjectPIIData(data.data);
      data.data = mergedData;
      const projectPayload = { ...data, status: dto?.type };
      return this.client.send(
        { cmd: BeneficiaryJobs.LIST_PROJECT_PII, uuid: dto.projectId },
        projectPayload
      );
    }
    if (!dto.projectId) {
      data.data = data?.data?.map((piiData) => ({ piiData }));
    }

    return data;
  }
  async listBenefByProject(data: any) {
    if (!data?.data.length) return data;
    const mergedProjectData = await this.mergeProjectData(data.data, data.payload)
    if (data?.extras) {
      data.data = { data: mergedProjectData, extras: data?.extras }

      if (data?.data.length) {
        console.log('sent data==', data)
        const mergedProjectData = await this.mergeProjectData(data.data, data.payload)
        console.log({ mergedProjectData })
        if (data?.extras) {
          data.data = { data: mergedProjectData || [], extras: data?.extras }
        }
        else {
          data.data = mergedProjectData || []
        }
        console.log({ data })
        return data;
      }
      else {
        data.data = mergedProjectData
      }
      return data;
    }
  }



  async listBenefGroupByProject(data: any) {
    if (data?.data.length > 0) {
      const groupData = await this.processBenfGroups(data.data)
      // return groupData
      data.data = groupData;
    }

    return data;
  }

  async getOneGroupByProject(uuid: UUID) {
    return await this.prisma.beneficiaryGroup.findUnique({
      where: {
        uuid: uuid
      },
      include: {
        groupedBeneficiaries: {
          where: {
            deletedAt: null
          },
          include: {
            Beneficiary: {
              include: {
                pii: true
              }
            },
          }
        }
      }
    })
  }

  async processBenfGroups(data: any) {
    const groups = []
    for (const d of data) {
      const data = await this.prisma.beneficiaryGroup.findUnique({
        where: {
          uuid: d?.uuid
        },
        include: {
          _count: {
            select: {
              groupedBeneficiaries: {
                where: {
                  deletedAt: null
                }
              }
            }
          },
        }
      })
      groups.push(data)
    }
    return groups
  }

  async list(
    dto: ListBeneficiaryDto
  ): Promise<PaginatorTypes.PaginatedResult<Beneficiary>> {
    let result = null as any;
    const AND_QUERY = createListQuery(dto);
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    const projectUUID = dto.projectId;
    const startDate = dto.startDate;
    const endDate = dto.endDate;

    let where: any = projectUUID ? {
      deletedAt: null,
      BeneficiaryProject: projectUUID === 'NOT_ASSGNED' ? {
        none: {}
      } : {
        some: {
          projectId: projectUUID
        }
      },
    } : {
      deletedAt: null
    }

    if (startDate && endDate) { where.createdAt = { gte: new Date(startDate), lte: new Date(endDate), } }

    if (startDate && !endDate) { where.createdAt = { gte: new Date(startDate) } }

    if (!startDate && endDate) { where.createdAt = { lte: new Date(endDate) } }

    result = await paginate(
      this.rsprisma.beneficiary,
      {
        where,
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


    const resultData = result.data

    if (resultData.length > 0) {
      const benfPiiData = await this.prisma.beneficiaryPii.findMany({
        where: {
          beneficiaryId: {
            in: resultData?.map((d) => d.id)
          }
        }
      })
      const piiDataMap = new Map();
      for (const piiData of benfPiiData) {
        piiDataMap.set(piiData.beneficiaryId, piiData);
      }

      const mergedData = resultData.map((d) => {
        const piiData = piiDataMap.get(d.id);
        if (piiData) {
          d.piiData = piiData;
        }
        return d;
      });
      result.data = mergedData;
    }



    return result
  }

  async mergeProjectData(data: any, payload?: any) {
    // const where: Prisma.BeneficiaryWhereInput = {
    //   uuid: {
    //     in: data.map(b => b.uuid)
    //   }
    // }
    // if (payload?.gender) {
    //   where.gender = payload.gender
    // }
    // if (payload?.internetStatus) {
    //   where.internetStatus = payload.internetStatus
    // }
    // if (payload?.phoneStatus) {
    //   where.phoneStatus = payload.phoneStatus
    // }
    // if (payload?.bankedStatus) {
    //   where.bankedStatus = payload.bankedStatus
    // }

    // const beneficiaries = await this.prisma.beneficiary.findMany({
    //   where,
    //   include: {
    //     pii: true
    //   }
    // })
    console.log('data', data)

    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        walletAddress: {
          in: data.map(b => b.walletAddress)
        }
      },
      include: {
        pii: true
      }
    })

    console.log({ beneficiaries })

    // const beneficiaries = []

    if (data && beneficiaries.length > 0) {
      console.log('data', data)
      const combinedData = data.map(((dat) => {
        const benDetails = beneficiaries.find((ben) => ben.walletAddress === dat.walletAddress);
        console.log('benDetails', benDetails)
        const { pii, ...rest } = benDetails || {};
        return {
          piiData: pii,
          projectData: rest,
          ...dat
        }
      }))
      console.log({ combinedData })
      return combinedData || [];
    }

    // TODO: remove projectData and piiData that has been added manually, as it will affects the FE. NEEDS to be refactord in FE as well.
    return beneficiaries.map(b => ({

      ...b,
      projectData: b,
      piiData: b?.pii
    }));
  }

  async mergeProjectPIIData(data: any) {
    const mergedData = [];
    for (const d of data) {
      const piiData = await this.rsprisma.beneficiaryPii.findUnique({
        where: { beneficiaryId: d.Beneficiary.id },
      });
      if (piiData) d.piiData = piiData;
      mergedData.push(d);
    }
    return mergedData;
  }

  async mergePIIData(data: any) {
    const mergedData = [];
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
    const { piiData, projectUUIDs, ...data } = dto;
    if (!data.walletAddress) {
      data.walletAddress = generateRandomWallet().address;
    }
    if (data.walletAddress) {
      const ben = await this.prisma.beneficiary.findUnique({
        where: {
          walletAddress: data.walletAddress,
        },
      });
      if (ben) throw new RpcException('Wallet should be unique');
      const isWallet = isAddress(data.walletAddress);
      if (!isWallet)
        throw new RpcException('Wallet should be valid Ethereum address');
    }
    if (!piiData.phone) throw new RpcException('Phone number is required');
    const benData = await this.rsprisma.beneficiaryPii.findUnique({
      where: {
        phone: piiData.phone,
      },
    });
    if (benData) throw new RpcException('Phone number should be unique');
    console
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    const rdata = await this.rsprisma.beneficiary.create({
      data,
    });
    console.log('rdata', rdata)
    if (piiData) {
      await this.prisma.beneficiaryPii.create({
        data: {
          beneficiaryId: rdata.id,
          phone: piiData.phone ? piiData.phone.toString() : null,
          ...piiData,
        },
      });
    }

    // Assign beneficiary to project while creating. Useful when a beneficiary is created from inside a project
    if (projectUUIDs?.length && rdata?.uuid) {
      console.log('projectUUIDs', projectUUIDs)
      const assignPromises = projectUUIDs.map(projectUuid => {
        return this.assignBeneficiaryToProject({ beneficiaryId: rdata?.uuid, projectId: projectUuid });
      });
      await Promise.all(assignPromises);
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
            Project: true,
          },
        },
      },
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
            Project: true,
          },
        },
      },
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
            Project: true,
          },
        },
      },
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
      walletAddress: dto.walletAddress || benef?.walletAddress,
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
    console.log(dto)
    return this.prisma.beneficiaryProject.create({ data: dto });
  }

  async addBulkBeneficiaryToProject(dto: addBulkBeneficiaryToProject) {
    const { dto: { beneficiaries, referrerBeneficiary, referrerVendor, type, projectUuid }
    } = dto;
    const projectPayloads = [];
    const benProjectData = [];

    const { beneficiaries: beneficiariesData } = await this.createBulk(beneficiaries);

    await Promise.all(
      beneficiariesData.map(async (ben: any) => {
        const projectPayload = {
          uuid: ben.uuid,
          walletAddress: ben.walletAddress,
          extras: ben?.extras || null,
          type: type,
          referrerBeneficiary,
          referrerVendor,
          piiData: ben?.pii
        }
        benProjectData.push({
          projectId: projectUuid,
          beneficiaryId: ben.uuid
        });
        projectPayloads.push(projectPayload);

      })
    )
    //2.Save beneficiary to project

    await this.prisma.beneficiaryProject.createMany({
      data: benProjectData
    })

    //3. Sync beneficiary to project

    return this.client.send(
      {
        cmd: BeneficiaryJobs.BULK_REFER_TO_PROJECT,
        uuid: projectUuid,
      },
      projectPayloads
    );


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

    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_ASSIGNED_TO_PROJECT, {
      projectUuid: projectId,
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

    // get project info
    const project = await this.prisma.project.findUnique({
      where: {
        uuid: projectId
      }
    })
    console.log('project', project)

    //1. Get beneficiary data
    const beneficiaryData = await this.rsprisma.beneficiary.findUnique({
      where: { uuid: beneficiaryId },
      include: { pii: true }
    });
    console.log('beneficiaryData', beneficiaryData)
    const projectPayload = {
      uuid: beneficiaryData.uuid,
      walletAddress: beneficiaryData.walletAddress,
      extras: beneficiaryData?.extras || null,
      type: BeneficiaryConstants.Types.ENROLLED,
      isVerfied: beneficiaryData?.isVerfied
    };


    // if project type if aa, remove type
    if (project.type.toLowerCase() === 'aa') {
      delete projectPayload.type;
      projectPayload['gender'] = beneficiaryData?.gender;
      projectPayload.extras = { ...projectPayload.extras, phone: beneficiaryData?.pii?.phone }
    }

    if (project.type.toLowerCase() === 'rp') {
      delete projectPayload.type;
    }

    console.log('projectPayload', projectPayload)

    // if project type is c2c, send verficition mail
    // if (project.type.toLowerCase() === 'c2c' && !beneficiaryData.isVerfied) {
    //   await this.verificationService.generateLink(beneficiaryId)
    // }

    //2.Save beneficiary to project

    await this.saveBeneficiaryToProject({
      beneficiaryId: beneficiaryId,
      projectId: projectId,
    });

    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_ASSIGNED_TO_PROJECT, {
      projectUuid: projectId,
    });


    //3. Sync beneficiary to project
    return handleMicroserviceCall({
      client: this.client.send(
        { cmd: BeneficiaryJobs.ADD_TO_PROJECT, uuid: projectId },
        projectPayload
      ),
      onSuccess(response) {
        console.log('response', response)
      },
      onError(error) {
        console.log('error', error)
        throw new RpcException(error.message)
      },
    }

    )
    // return this.client.send(
    //   { cmd: BeneficiaryJobs.ADD_TO_PROJECT, uuid: projectId },
    //   projectPayload
    // );
  }

  async update(uuid: UUID, dto: UpdateBeneficiaryDto) {
    const findUuid = await this.prisma.beneficiary.findUnique({
      where: {
        uuid,
      },
    });

    if (!findUuid) throw new Error('Data not Found');
    const { piiData, id, ...rest } = dto;

    const benWithSameNumber = await this.rsprisma.beneficiaryPii.findFirst({
      where: {
        phone: piiData.phone,
        beneficiaryId: { not: id }
      },
    });
    if (benWithSameNumber) throw new RpcException('Phone number should be unique');

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

  async delete(uuid: UUID) {
    const findUuid = await this.prisma.beneficiary.findUnique({
      where: {
        uuid,
      },
    });

    if (!findUuid) throw new Error('Data not Found');

    await this.deletePIIByBenefUUID(uuid);

    const rdata = await this.prisma.beneficiary.delete({
      where: {
        uuid,
      }
    });

    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_UPDATED);
    return rdata;
  }

  async deletePIIByBenefUUID(benefUUID: UUID) {

    const beneficiary = await this.findOne(benefUUID);

    const beneficiaryId = beneficiary.piiData.beneficiaryId;

    if (beneficiary) {
      return this.rsprisma.beneficiaryPii.delete({
        where: { beneficiaryId },
      });
    }
  }

  async remove(payload: any) {
    const uuid = payload.uuid;
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
    this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_REMOVED, {
      projectUuid: uuid
    });

    const res = await this.prisma.groupedBeneficiaries.updateMany({
      where: {
        beneficiaryId: findUuid.uuid
      },
      data: {
        deletedAt: new Date()
      }
    })

    return rdata;
  }

  async createBulk(dtos: CreateBeneficiaryDto[], projectUuid?: string, conditional?: boolean) {
    return this.prisma.$transaction(async (prm) => {
      console.log('dtos', dtos, projectUuid);

      // Validate phone numbers are present and unique
      if (!dtos.every((dto) => dto.piiData.phone)) {
        throw new RpcException('Phone number is required');
      }

      const duplicatePhones = await this.checkPhoneNumber(dtos);
      if (duplicatePhones.length > 0) {
        throw new RpcException(`${duplicatePhones.join(', ')} - Phone numbers must be unique`);
      }

      // Validate wallet addresses are unique if provided
      if (dtos.every((dto) => dto.walletAddress)) {
        const duplicateWallets = await this.checkWalletAddress(dtos);
        if (duplicateWallets.length > 0) {
          throw new RpcException('Wallet addresses must be unique');
        }
      }

      // Pre-generate UUIDs and wallet addresses if necessary
      dtos.forEach((dto) => {
        dto.uuid = dto.uuid || uuidv4();
        dto.walletAddress = dto.walletAddress || (dto.walletAddress ? dto.walletAddress : generateRandomWallet().address);
      });

      // Separate PII data and beneficiary data for insertion
      const beneficiariesData = dtos.map(({ piiData, ...data }) => data);
      const piiDataList = dtos.map(({ uuid, piiData }) => ({ ...piiData, uuid }));

      // Insert beneficiaries in bulk
      await prm.beneficiary.createMany({ data: beneficiariesData }).catch((e) => {
        throw new RpcException(e.message);
      });

      // Retrieve inserted beneficiaries for linking PII data
      const insertedBeneficiaries = await prm.beneficiary.findMany({
        where: { uuid: { in: dtos.map((dto) => dto.uuid) } },
      });

      // Map PII data with correct beneficiary IDs
      const piiBulkInsertData = piiDataList.map((piiData) => {
        const beneficiary = insertedBeneficiaries.find((b) => b.uuid === piiData.uuid);
        return {
          beneficiaryId: beneficiary.id,
          ...piiData,
          uuid: undefined, // Remove the temporary UUID field
        };
      });

      // Insert PII data in bulk
      if (piiBulkInsertData.length > 0) {
        const sanitizedPiiData = piiBulkInsertData.map((pii) => ({
          ...pii,
          phone: pii.phone ? pii.phone.toString() : null,
        }));
        await prm.beneficiaryPii.createMany({ data: sanitizedPiiData });
      }

      // Retrieve inserted beneficiaries with their PII data
      const insertedBeneficiariesWithPii = await prm.beneficiary.findMany({
        where: { uuid: { in: dtos.map((dto) => dto.uuid) } },
        include: { pii: true },
      });

      // Assign beneficiaries to the project if a projectUuid is provided
      if (projectUuid && conditional) {
        await prm.beneficiaryProject.createMany({
          data: insertedBeneficiariesWithPii.map(({ uuid, }) => ({
            beneficiaryId: uuid,
            projectId: projectUuid
          }))
        })
        // const assignPromises = insertedBeneficiariesWithPii.map((b) =>
        //   this.assignBeneficiaryToProject({ beneficiaryId: b.uuid, projectId: projectUuid })
        // );
        // console.log('assignPromises', assignPromises)
        // await Promise.all(assignPromises);
      }

      // Emit an event after beneficiaries are created
      this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_CREATED, { projectUuid });

      // Return success response
      return { success: true, count: dtos.length, beneficiaries: insertedBeneficiariesWithPii };
    });
  }




  async checkWalletAddress(dtos) {
    const wallets = dtos.map((dto) => dto.walletAddress);
    const ben = await this.prisma.beneficiary.findMany({
      where: {
        walletAddress: {
          in: wallets,
        },
      },
    });
    return ben;
  }

  async checkPhoneNumber(dtos) {
    const phoneNumber = dtos.map((dto) => dto.piiData.phone.toString());
    const ben = await this.prisma.beneficiaryPii.findMany({
      where: {
        phone: {
          in: phoneNumber,
        },
      },
    });

    return ben ? ben.map(p => p.phone) : []
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
        projectId,
      },
    });

    const vendorTotal = await this.prisma.projectVendors.count({
      where: {
        projectId,
      },
    });


    return this.client.send(
      { cmd: "rahat.jobs.project.redemption_stats", uuid: projectId },
      { benTotal, vendorTotal })

    // return { benTotal, vendorTotal };
  }

  async getProjectSpecificData(data) {
    const { benId, projectId } = data;
    const benData = await this.findOne(benId);
    if (benData)
      return this.client.send(
        { cmd: BeneficiaryJobs.GET, uuid: projectId },
        { uuid: benId, data: benData }
      );
    return benData;
  }

  async addGroup(dto: CreateBeneficiaryGroupsDto) {
    const group = await this.prisma.beneficiaryGroup.create({
      data: {
        name: dto.name
      }
    })
    const createPayload = dto.beneficiaries.map((d) => ({
      beneficiaryGroupId: group.uuid,
      beneficiaryId: d.uuid
    }))

    return await this.prisma.groupedBeneficiaries.createMany({
      data: createPayload
    })
  }

  async getOneGroup(uuid: string) {
    return this.prisma.beneficiaryGroup.findUnique({
      where: {
        uuid: uuid
      },
      include: {
        groupedBeneficiaries: {
          where: {
            deletedAt: null
          },
          include: {
            Beneficiary: {
              include: {
                pii: true
              }
            }
          }
        }
      }
    })
  }

  async removeOneGroup(uuid: string) {
    const benfGroup = await this.prisma.beneficiaryGroup.findUnique({
      where: {
        uuid,
        deletedAt: null
      }
    })
    if (!benfGroup) throw new RpcException('Beneficiary group not found or already deleted.')

    return this.prisma.beneficiaryGroup.update({
      where: {
        uuid: uuid
      },
      data: {
        deletedAt: new Date(),
      }
    })
  }

  async getAllGroups(dto: ListBeneficiaryGroupDto) {
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    const projectUUID = dto.projectId;

    const where = projectUUID ? {
      deletedAt: null,
      beneficiaryGroupProject: projectUUID === 'NOT_ASSGNED' ? {
        none: {}
      } : {
        some: {
          projectId: projectUUID
        }
      }
    } : {
      deletedAt: null
    }

    console.time("group")

    const data = await paginate(
      this.prisma.beneficiaryGroup,
      {
        where,
        select: {
          id: true,
          uuid: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              groupedBeneficiaries: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
          beneficiaryGroupProject: {
            select: {
              Project: {
                select: {
                  id: true,
                  name: true,
                },
              },
              deletedAt: true,
            },
            where: {
              deletedAt: null,
            },
          },
          groupedBeneficiaries: {
            select: {
              Beneficiary: {
                select: {
                  id: true,
                  uuid: true,
                  pii: {
                    select: {
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
              deletedAt: true,
            },
            where: {
              deletedAt: null,
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

    console.timeEnd("group")
    console.log(new Date())
    return data
  }

  async updateGroup(uuid: UUID, dto: UpdateBeneficiaryGroupDto) {
    //Step: 1
    // Find the existing group
    const existingGroup = await this.prisma.beneficiaryGroup.findUnique({
      where: { uuid: uuid },
      include: { groupedBeneficiaries: true }
    });

    if (!existingGroup) throw new Error('Group not found.');

    // Update the group's name if provided
    const updatedData = await this.prisma.beneficiaryGroup.update({
      where: { uuid: uuid },
      data: { name: dto?.name || existingGroup?.name }
    });

    // Delete all existing grouped beneficiaries for the group
    await this.prisma.groupedBeneficiaries.deleteMany({
      where: { beneficiaryGroupId: updatedData.uuid }
    });

    // Create new grouped beneficiaries
    const updatedGroupedBeneficiaries = await this.prisma.groupedBeneficiaries.createMany({
      data: dto.beneficiaries.map((d) => ({
        beneficiaryGroupId: updatedData.uuid,
        beneficiaryId: d.uuid
      }))
    });

    //Step:2
    //Get beneficiary group data
    const beneficiaryGroupData = await this.prisma.beneficiaryGroup.findUnique({
      where: {
        uuid: uuid,
      },
      include: {
        groupedBeneficiaries: true
      }
    })

    const benfsInGroup = beneficiaryGroupData.groupedBeneficiaries?.map((d) => d.beneficiaryId)

    const benefGroupProjects = await this.prisma.beneficiaryGroupProject.findMany({
      where: {
        beneficiaryGroupId: existingGroup.uuid
      }
    })

    if (benefGroupProjects.length > 0) {
      for (const project of benefGroupProjects) {

        // get beneficiaries from the group not assigned to project
        const unassignedBenfs = await this.prisma.beneficiary.findMany({
          where: {
            AND: [
              {
                uuid: {
                  in: benfsInGroup
                }
              },
              {
                BeneficiaryProject: {
                  none: {
                    projectId: project.projectId
                  }
                }
              },
            ],
            deletedAt: null
          }
        });
        console.log('unassignedBenfs', unassignedBenfs)

        // bulk assign unassigned beneficiaries from group
        if (unassignedBenfs?.length) {
          for (const unassignedBenf of unassignedBenfs) {
            await this.assignBeneficiaryToProject({ beneficiaryId: unassignedBenf.uuid, projectId: project.projectId })
          }
        }
      }
      return 'Success';
    } else return updatedGroupedBeneficiaries;
  }

  async saveBeneficiaryGroupToProject(dto: AddBenfGroupToProjectDto) {
    return this.prisma.beneficiaryGroupProject.create({
      data: {
        beneficiaryGroupId: dto.beneficiaryGroupId,
        projectId: dto.projectId
      }
    })
    // return this.prisma.beneficiaryProject.create({ data: dto });
  }

  async assignBeneficiaryGroupToProject(dto: AddBenfGroupToProjectDto) {
    try {
      const { beneficiaryGroupId, projectId } = dto;

      // get project info
      const project = await this.prisma.project.findUnique({
        where: {
          uuid: projectId
        }
      })

      //1. Get beneficiary group data
      const beneficiaryGroupData = await this.prisma.beneficiaryGroup.findUnique({
        where: {
          uuid: beneficiaryGroupId,
        },
        include: {
          groupedBeneficiaries: true
        }
      })

      const benfsInGroup = beneficiaryGroupData.groupedBeneficiaries?.map((d) => d.beneficiaryId)

      // get beneficiaries from the group not assigned to selected project
      const unassignedBenfs = await this.prisma.beneficiary.findMany({
        where: {
          AND: [
            {
              uuid: {
                in: benfsInGroup
              }
            },
            {
              BeneficiaryProject: {
                none: {
                  projectId: project.uuid
                }
              }
            },
          ],
          deletedAt: null
        }
      });

      // bulk assign unassigned beneficiaries from group
      if (unassignedBenfs?.length) {
        for (const unassignedBenf of unassignedBenfs) {
          await this.assignBeneficiaryToProject({ beneficiaryId: unassignedBenf.uuid, projectId: project.uuid })
        }
      }

      // add as required by project specifics
      const projectPayload = {
        beneficiaryGroupData
      }

      //2.Save beneficiary group to project
      await this.saveBeneficiaryGroupToProject(dto);

      //3. Sync beneficiary to project
      return this.client.send(
        { cmd: BeneficiaryJobs.ADD_GROUP_TO_PROJECT, uuid: project.uuid },
        projectPayload
      );
    } catch (err) {
      console.log(err);
    }
  }

  // async listTempBeneficiaries(uuid: string, query: ListTempBeneficiariesDto) {

  //   const res = await this.prisma.tempGroup.findUnique({
  //     where: {
  //       uuid: uuid

  //     },
  //     include: {
  //       TempGroupedBeneficiaries: {
  //         select: {
  //           tempBeneficiary: true
  //         }
  //       }
  //     }

  //   })
  //   if (query && query.page && query.perPage) {


  //     let filter = {} as any;
  //     if (query.firstName) filter.firstName = { contains: query.firstName, mode: 'insensitive' }

  //     const startIndex = (query.page - 1) * query.perPage;
  //     const endIndex = query.page * query.perPage;
  //     const paginatedBeneficiaries = res.TempGroupedBeneficiaries.slice(
  //       startIndex,
  //       endIndex,
  //     )
  //     console.log(paginatedBeneficiaries);
  //     const total = res.TempGroupedBeneficiaries.length;
  //     const lastPage = Math.ceil(total / query.perPage);

  //     const meta = {
  //       total,
  //       lastPage,
  //       currentPage: query.page,
  //       perPage: query.perPage,
  //     };

  //     return {
  //       ...res,
  //       beneficiariesGroup: paginatedBeneficiaries,
  //       meta,
  //     };
  //   }
  //   return res;
  // }




  async listTempBeneficiaries(uuid: string, query: ListTempBeneficiariesDto) {
    const res = await this.prisma.tempGroup.findUnique({
      where: {
        uuid: uuid

      },
      include: {
        TempGroupedBeneficiaries: {
          select: {
            tempBeneficiary: true
          }
        }
      }

    })
    if (query && query.page && query.perPage) {
      const filteredData = res.TempGroupedBeneficiaries.filter((d) => {
        return Object.keys(query).every(key => {
          if (key === "firstName") {
            return d.tempBeneficiary.firstName.toLowerCase().includes(query[key].toLowerCase());
          }
          return true;
        });
      });
      const startIndex = (query.page - 1) * query.perPage;
      const endIndex = query.page * query.perPage;
      const paginatedBeneficiaries = filteredData.map(({ tempBeneficiary, ...rest }) => ({
        ...tempBeneficiary,
        ...rest
      })).slice(
        startIndex,
        endIndex,
      )
      const total = filteredData.length;
      const lastPage = Math.ceil(total / query.perPage);
      const hasNextPage = endIndex < total;
      const hasPreviousPage = startIndex > 0;
      const next = hasNextPage ? query.page + 1 : null;
      const prev = hasPreviousPage ? query.page - 1 : null;

      const meta = {
        total,
        lastPage,
        currentPage: query.page,
        perPage: query.perPage,
        prev,
        next
      };

      return {

        tempeBeneficiary: paginatedBeneficiaries,
        meta,
      };
    }
    return res;
  }


  // async listTempBeneficiaries(uuid: string, query: ListTempBeneficiariesDto) {
  //   const whereFilter: Prisma.TempGroupWhereInput = {
  //     uuid,
  //     ...(query.firstName && {
  //       firstName: {
  //         contains: query.firstName,
  //         mode: 'insensitive',
  //       },
  //     }),
  //   };

  //   const total = await this.prisma.tempGroup.count({
  //     where: {
  //       ...whereFilter,
  //       TempGroupedBeneficiaries: {
  //         some: {
  //           tempBeneficiary: {
  //             firstName: {
  //               contains: query.firstName,
  //               mode: 'insensitive',
  //             }
  //           }
  //         }
  //       }
  //     },


  //   });

  //   const paginatedBeneficiaries = await this.prisma.tempGroup.findMany({
  //     where: whereFilter,
  //     include: {
  //       TempGroupedBeneficiaries: {
  //         select: {
  //           tempBeneficiary: true
  //         }
  //       }
  //     },
  //     skip: query.page && query.perPage ? (query.page - 1) * query.perPage : undefined,
  //     take: query.page && query.perPage ? query.perPage : undefined,
  //   });

  //   const lastPage = query.page && query.perPage ? Math.ceil(total / query.perPage) : undefined;

  //   const meta = {
  //     total,
  //     lastPage,
  //     currentPage: query.page,
  //     perPage: query.perPage,
  //   };

  //   return {
  //     TempGroupedBeneficiaries: paginatedBeneficiaries,
  //     meta,
  //   };
  // }


  listTempGroups(query: ListTempGroupsDto) {

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy['createdAt'] = query.order;
    let filter = {} as any;
    if (query.name) filter.name = { contains: query.name, mode: 'insensitive' }
    return paginate(
      this.prisma.tempGroup,
      {
        where: filter,
        orderBy
      },
      {
        page: query.page,
        perPage: query.perPage,
      }
    );
  }

  async importBeneficiariesFromTool(data: any) {
    const dataFromBuffer = Buffer.from(data);
    const bufferString = dataFromBuffer.toString('utf-8');
    const jsonData = JSON.parse(bufferString) || null;
    if (!jsonData) return null;
    const { groupName, beneficiaries } = jsonData;
    const beneficiaryData = beneficiaries.map((d: any) => {
      return {
        firstName: d.firstName,
        lastName: d.lastName,
        walletAddress: d.walletAddress,
        govtIDNumber: d.govtIDNumber,
        gender: d.gender,
        bankedStatus: d.bankedStatus,
        phoneStatus: d.phoneStatus,
        internetStatus: d.internetStatus,
        email: d.email || null,
        phone: d.phone || null,
        birthDate: d.birthDate || null,
        location: d.location || null,
        latitude: d.latitude || null,
        longitude: d.longitude || null,
        notes: d.notes || null,
        extras: d.extras || null,
      }
    })
    const tempBenefPhone = await this.listTempBenefPhone();
    return this.prisma.$transaction(async (txn) => {
      // 1. Upsert temp group by name
      const group = await txn.tempGroup.upsert({
        where: { name: groupName },
        update: { name: groupName },
        create: { name: groupName }
      })
      return this.saveTempBenefAndGroup(txn, group.uuid, beneficiaryData, tempBenefPhone);
    })

  }

  async listTempBenefPhone() {
    return this.prisma.tempBeneficiary.findMany({
      select: {
        phone: true,
        uuid: true
      }
    })
  }

  async saveTempBenefAndGroup(txn: any, groupUID: string, beneficiaries: any[], tempBenefPhone: any[]) {
    for (let b of beneficiaries) {
      const row = await txn.tempBeneficiary.create({
        data: b
      });
      const benefUID = row.uuid;
      // 3. Upsert temp benef group
      await txn.tempBeneficiaryGroup.upsert({
        where: {
          tempBeneficiaryGroupIdentifier: {
            tempGroupUID: groupUID,
            tempBenefUID: benefUID
          }
        },
        update: {
          tempGroupUID: groupUID,
          tempBenefUID: benefUID
        },
        create: {
          tempGroupUID: groupUID,
          tempBenefUID: benefUID
        }
      })

    }
    return 'Beneficiary imported to temp storage!'
  }

  async importTempBeneficiaries(dto: ImportTempBenefDto) {
    const groups = await findTempBenefGroups(this.prisma, dto.groupUUID);
    if (!groups.length) throw new Error("No groups found!")
    const beneficiaries = groups.map((f) => f.tempBeneficiary);
    if (!beneficiaries.length) throw new Error('No benficiaries found!');

    const dupliPhones = await validateDupicatePhone(this.prisma, beneficiaries);
    if (dupliPhones.length) throw new Error(`Duplicate phones found: ${dupliPhones.toString()}`);
    const dupliWallets = await validateDupicateWallet(this.prisma, beneficiaries);
    if (dupliWallets.length) throw new Error(`Duplicate walletAddress found: ${dupliWallets.toString()}`);

    this.beneficiaryQueue.add(BeneficiaryJobs.IMPORT_TEMP_BENEFICIARIES, dto)
    return { message: "Beneficiaries added to the import queue!" }
  }

  async projectStatsDataSource(uuid?: UUID) {
    return this.prisma.stats.findMany(
      {
        where: {
          group: `source_${uuid}`
        }
      })
  }

  async allDataSource() {
    return this.prisma.stats.findMany(
      {
        where: {
          group: `source`
        }
      })
  }
}
