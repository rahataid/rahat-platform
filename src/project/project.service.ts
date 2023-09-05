import { Injectable } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { bufferToHexString, hexStringToBuffer } from '@utils/string-format';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectDto } from './dto/list-project-dto';
import {
  UpdateProjectCampaignDto,
  UpdateProjectDto,
} from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    console.log('first', createProjectDto);
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
        _count: {
          select: {
            beneficiaries: true,
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

  // TODO: implement search and pagination feature and create dto
  async getBeneficiaries(address: string) {
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

    return paginate(
      this.prisma.beneficiary,
      {
        where,
        select,
        orderBy,
      },
      {
        page: 1,
        transformRows: (rows) =>
          rows.map((r) => ({
            ...r,
            walletAddress: bufferToHexString(r.walletAddress),
          })),
      },
    );
  }
}
