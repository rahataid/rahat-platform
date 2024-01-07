import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { bufferToHexString, hexStringToBuffer } from '@utils/string-format';
import { createContractInstance, multiCall } from '@utils/web3';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ListProjectBeneficiaryDto,
  ListProjectDto,
} from './dto/list-project-dto';
import {
  UpdateProjectCampaignDto,
  UpdateProjectDto,
} from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) { }

  async create(createProjectDto: CreateProjectDto) {
    const { owner, contractAddress, ...rest } = createProjectDto;

    // contractAddress =
    const created: Project = await this.prisma.project.create({
      data: {
        ...rest,

        contractAddress: hexStringToBuffer(contractAddress),
        owner: {
          connect: {
            id: owner,
          },
        },
      },
    });

    return {
      ...created,
      contractAddress: bufferToHexString(created.contractAddress),
    };
  }

  findAll(query: ListProjectDto) {
    const { page, perPage, ...rest } = query;
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };
    const select: Prisma.ProjectSelect = {
      id: true,
      budget: true,
      contractAddress: true,
      name: true,
      createdAt: true,
      startDate: true,
      endDate: true,
      description: true,
      extras: true,

      // _count: {
      //   select: {
      //     beneficiaries: true,
      //     owner: true,
      //     vendors: true,
      //   },
      // },
    };

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    if (rest.name) {
      where.name = {
        contains: rest.name,
        mode: 'insensitive',
      };
    }

    return paginate(
      this.prisma.project,
      { where, select, orderBy },
      {
        page,
        perPage,
        transformRows: (rows) => {
          return rows.map((r) => ({
            ...r,
            contractAddress: bufferToHexString(r.contractAddress),
          }));
        },
      },
    );
  }

  async findOne(contractAddress: string) {
    const project = await this.prisma.project.findFirstOrThrow({
      where: {
        contractAddress: {
          equals: hexStringToBuffer(contractAddress),
        },
      },
      include: {
        vendors: {
          select: {
            walletAddress: true,
            id: true,
          },
        },
        _count: {
          select: {
            beneficiaries: {
              where: {
                // deletedAt: null,
                isActive: true,
              },
            },
            owner: true,
            vendors: true,
          },
        },
      },
    });

    return {
      ...project,
      contractAddress: bufferToHexString(project.contractAddress),
    };
  }

  async update(contractAddress: string, updateProjectDto: UpdateProjectDto) {
    return this.prisma.project.update({
      data: updateProjectDto,
      where: {
        contractAddress: hexStringToBuffer(contractAddress),
      },
    });
  }

  remove(id: number) {
    return this.prisma.project.update({
      data: {
        deletedAt: new Date(),
      },
      where: {
        id,
      },
    });
  }

  updateCampaign(contractAddress: string, campaigns: UpdateProjectCampaignDto) {
    return this.prisma.project.update({
      where: {
        contractAddress: hexStringToBuffer(contractAddress),
      },
      data: {
        campaigns: {
          push: campaigns.id,
        },
      },
    });
  }

  async removeCampaignFromProject(
    contractAddress: string,
    campaigns: number[],
  ) {
    const project = await this.prisma.project.findUnique({
      where: { contractAddress: hexStringToBuffer(contractAddress) },
      select: {
        campaigns: true,
      },
    });

    const filteredCampaigns = project.campaigns.filter(
      (c) => !campaigns.includes(c),
    );

    return this.prisma.project.update({
      where: {
        contractAddress: hexStringToBuffer(contractAddress),
      },
      data: {
        campaigns: {
          set: filteredCampaigns,
        },
      },
    });
  }

  // TODO: implement search and pagination feature and create dto
  async getBeneficiaries(address: string, query: ListProjectBeneficiaryDto) {
    const { page, perPage, walletAddress, ...rest } = query;

    const select: Prisma.BeneficiarySelect = {
      uuid: true,
      name: true,
      bankStatus: true,
      internetAccess: true,
      phoneOwnership: true,
      gender: true,
      latitude: true,
      longitude: true,
      walletAddress: true,
      isApproved: true,
      phone: true,
    };

    const orderBy: Prisma.BeneficiaryOrderByWithRelationInput = {
      name: 'asc',
    };

    const where: Prisma.BeneficiaryWhereInput = {
      deletedAt: null,
      projects: {
        some: {
          contractAddress: hexStringToBuffer(address),
        },
      },
    };

    if (rest.name) {
      where.name = {
        contains: rest.name,
        mode: 'insensitive',
      };
    }

    if (rest.phone) {
      where.phone = rest.phone;
    }

    if (rest.bankStatus) {
      where.bankStatus = rest.bankStatus;
    }

    if (rest.internetAccess) {
      where.internetAccess = rest.internetAccess;
    }

    if (rest.phoneOwnership) {
      where.phoneOwnership = rest.phoneOwnership;
    }

    if (walletAddress) {
      where.walletAddress = hexStringToBuffer(walletAddress);
    }

    return paginate(
      this.prisma.beneficiary,
      {
        where,
        select,
        orderBy,
      },
      {
        page,
        perPage,
        transformRows: (rows) =>
          rows.map((r) => ({
            ...r,
            walletAddress: bufferToHexString(r.walletAddress),
          })),
      },
    );
  }

  async removeBeneficiariesFromProject(
    contractAddress: string,
    beneficiaries: string[],
  ) {
    for (const benAddress of beneficiaries) {
      await this.prisma.project.update({
        where: { contractAddress: hexStringToBuffer(contractAddress) },
        data: {
          beneficiaries: {
            disconnect: {
              walletAddress: hexStringToBuffer(benAddress),
            },
          },
        },
        include: {
          beneficiaries: true, // Include the updated list of beneficiaries
        },
      });
    }
    return 'Disconnected Succesfully';
  }

  async setOfflineBeneficiariesFromProject(contractAddress: string) {
    const projectDetails = await this.findOne(contractAddress);

    const beneficiaries: any = await this.getBeneficiaries(contractAddress, {
      orderBy: 'name',
      order: 'asc',
    });

    if (!beneficiaries?.rows?.length) return;

    const offlineBenData = beneficiaries.rows.map((beneficiary) => ({
      name: beneficiary.name,
      phone: beneficiary.phone,
      walletAddress: hexStringToBuffer(beneficiary.walletAddress),
      otp: '1111',
      otpHash: hexStringToBuffer(
        '0x3531cc3dc5bb231b65d260771886cc583d8fe8fb29b457554cb1930a722a747d',
      ),
      projects: {
        connect: {
          id: projectDetails.id,
        },
      },
    }));

    const [created] = await Promise.all([
      offlineBenData.map(async (ben) => {
        return await this.prisma.offlineBeneficiary.create({
          data: ben,
        });
      }),
    ]);
    return created;
  }

  async getOfflineBeneficiariesFromProject(contractAddress: string) {
    const { id: projectId } = await this.findOne(contractAddress);
    let offlineBeneficiariesWithProjects =
      await this.prisma.offlineBeneficiary.findMany({
        where: {
          projects: {
            some: {
              id: projectId,
            },
          },
        },
      });
    const callData = offlineBeneficiariesWithProjects.map((el) => [
      bufferToHexString(el.walletAddress),
    ]);

    const CVAProject = await createContractInstance(
      await this.getContractByName('CVAProject'),
      this.prisma.appSettings,
    );
    let multiRes = await multiCall(CVAProject, 'beneficiaryClaims', callData);
    multiRes = multiRes.map((el) => {
      return CVAProject.interface
        .decodeFunctionResult('beneficiaryClaims', el)
        .toString();
    });

    offlineBeneficiariesWithProjects = offlineBeneficiariesWithProjects.map(
      (el: any, i: number) => ({
        ...el,
        tokens: multiRes[i].toString(),
        otpHash: bufferToHexString(el.otpHash),
        walletAddress: bufferToHexString(el.walletAddress),
      }),
    );
    return offlineBeneficiariesWithProjects;
  }

  async getContractByName(contractName: string) {
    const addresses = await this.prisma.appSettings.findMany({
      where: {
        name: 'CONTRACT_ADDRESS',
      },
    });

    const address = addresses[0].value[contractName];
    if (!address) {
      throw new Error(`Contract ${contractName} not found.`);
    }

    return address;
  }
}
