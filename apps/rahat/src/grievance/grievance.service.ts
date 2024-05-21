import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateGrievanceDTO, ListGrievanceDTO } from "@rahataid/extensions";
import { GrievanceStatus } from "@rahataid/sdk";
import { PaginatorTypes, PrismaService, paginator } from "@rumsan/prisma";


const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class GrievanceService {

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async createGrievance(data: CreateGrievanceDTO, userId: number) {
    console.log('data', data)
    const { projectId, ...rest } = data;
    return this.prisma.grievance.create({
      data: {
        ...rest,
        project: {
          connect: {
            uuid: projectId
          }
        },
        reportedBy: {
          connect: {
            id: userId
          }
        },
        status: GrievanceStatus.NEW
      }
    })
  }

  async findAll(query: ListGrievanceDTO) {
    const include: Prisma.GrievanceInclude = {
      project: {
        select: {
          name: true,
          uuid: true
        }
      },
      reportedBy: {
        select: {
          name: true,
          uuid: true,
          id: true
        }
      }
    }
    const where: Prisma.GrievanceWhereInput = {

    }

    if (query.projectId) {
      where.projectId = {
        equals: query.projectId
      }
    }

    return paginate(this.prisma.grievance, {
      include,
      where
    }, {
      page: query.page,
      perPage: query.perPage,
    });
  }

}
