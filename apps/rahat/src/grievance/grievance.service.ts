// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ChangeGrievanceStatusDTO, ListGrievanceDTO } from "@rahataid/extensions";
import { PaginatorTypes, PrismaService, paginator } from "@rumsan/prisma";


const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class GrievanceService {

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async createGrievance(data: any, userId: number) {
    return this.prisma.grievance.create({
      data: {
        ...data,
        reporterUserId: userId
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
      reporterUser: {
        select: {
          name: true,
          uuid: true,
          id: true
        }
      }
    }
    const where: Prisma.GrievanceWhereInput = {
      deletedAt: null
    }

    if (query.projectId) {
      where.projectId = {
        equals: query.projectId
      }
    }

    if (query.title) {
      where.title = {
        contains: query.title,
        mode: 'insensitive'
      }
    }

    return paginate(this.prisma.grievance, {
      include,
      where,
      orderBy: {
        createdAt: 'desc'
      }
    }, {
      page: query.page,
      perPage: query.perPage,
    });
  }

  async changeStatus(uuid: string, data: ChangeGrievanceStatusDTO) {
    const { status } = data;
    return this.prisma.grievance.update({
      where: {
        uuid
      },
      data: {
        status: status as any
      }
    })
  }

  async getGrievance(uuid: string) {
    return this.prisma.grievance.findUnique({
      where: {
        uuid
      },
      include: {
        project: {
          select: {
            name: true,
            uuid: true
          }
        },
        reporterUser: {
          select: {
            name: true,
            uuid: true,
            id: true
          }
        }
      }
    })
  }

  async softDelete(uuid: string) {
    return this.prisma.grievance.update({
      where: {
        uuid
      },
      data: {
        deletedAt: new Date()
      }
    })
  }

  async updateProjectGrievance(uuid: string, data: any) {
    const { projectId, userId, ...updateData } = data;

    const updatePayload: any = { ...updateData };

    if (projectId) {
      updatePayload.project = {
        connect: { uuid: projectId }
      };
    }

    if (userId) {
      updatePayload.reporterUser = {
        connect: { id: userId }
      };
    }

    return this.prisma.grievance.update({
      where: { uuid },
      data: updatePayload
    });
  }

}
