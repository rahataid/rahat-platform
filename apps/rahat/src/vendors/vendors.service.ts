// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
// import * as jwt from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  GetVendorOtp,
  VendorAddToProjectDto,
  VendorRegisterDto,
} from '@rahataid/extensions';
import { ProjectContants, UserRoles, VendorJobs } from '@rahataid/sdk';
import { PaginatorTypes, PrismaService, paginator } from '@rumsan/prisma';
import { CONSTANTS } from '@rumsan/sdk/constants/index';
import { Service } from '@rumsan/sdk/enums';
import { AuthsService } from '@rumsan/user';
import { decryptChallenge } from '@rumsan/user/lib/utils/challenge.utils';
import { getSecret } from '@rumsan/user/lib/utils/config.utils';
import { getServiceTypeByAddress } from '@rumsan/user/lib/utils/service.utils';
import { UUID } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { Address } from 'viem';
import { NotificationService } from '../notification/notification.service';
import { UsersService } from '../users/users.service';
import { isAddress } from '../utils/web3';
import { handleMicroserviceCall } from './handleMicroServiceCall.util';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class VendorsService {

  private readonly logger = new Logger(VendorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthsService,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy
  ) { }


  //TODO: Fix allow duplicate users?
  async registerVendor(dto: VendorRegisterDto) {
    const vendor = await this.prisma.$transaction(async (prisma) => {
      const role = await prisma.role.findFirst({
        where: { name: UserRoles.VENDOR },
      });
      if (!role) throw new Error('Role not found');
      // Add to User table
      const { service, wallet, authWallet, ...rest } = dto;
      if (dto?.email || dto?.phone) {
        const userData = await prisma.user.findFirst({
          where: {
            OR: [{ email: dto.email }, { phone: dto.phone }],
          },
        });

        if (userData) {
          if (userData?.email === dto.email)
            throw new Error('Email must be unique');
          if (userData?.phone === dto.phone)
            throw new Error('Phone Number must be unique');
        }
      }

      const user = await prisma.user.create({ data: { ...rest, wallet } });

      // Add to UserRole table
      const userRolePayload = { userId: user.id, roleId: role.id };
      await prisma.userRole.create({ data: userRolePayload });
      // Add to Auth table
      await prisma.auth.create({
        data: {
          userId: +user.id,
          service: dto.service as any,
          serviceId: dto.authWallet ? authWallet : wallet,
          details: dto.extras,
        },
      });
      if (dto.service === Service.WALLET) return user;

      await prisma.auth.create({
        data: {
          userId: +user.id,
          service: Service.WALLET,
          serviceId: dto.wallet,
          details: dto.extras,
        },
      });
      return user;
    });

    this.notificationService.createNotification({
      title: `Vendor Waiting for Approval`,
      description: `Vendor ${vendor.name} is waiting for admin approval`,
      group: 'Vendor Management',
      notify: true,
    })
    return vendor;
  }

  async assignToProject(dto: VendorAddToProjectDto) {
    const { vendorId, projectId } = dto;
    const vendorUser = await this.prisma.user.findUnique({
      where: { uuid: vendorId },
    });
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: vendorUser.id },
      include: {
        Role: {
          select: { name: true },
        },
      },
    });
    const isVendor = userRoles.some(
      (userRole) => userRole.Role.name === UserRoles.VENDOR
    );
    if (!isVendor) throw new Error('Not a vendor');
    const projectPayload = {
      uuid: vendorId,
      walletAddress: vendorUser.wallet,
    };

    const assigned = await this.getVendorAssignedToProject(vendorId, projectId);

    if (assigned)
      throw new RpcException(
        new BadRequestException('Vendor already assigned to the project!')
      );
    // //2. Save vendor to project
    // await this.prisma.projectVendors.create({
    //   data: {
    //     projectId,
    //     vendorId: vendorId,
    //   },
    // });

    const response = await handleMicroserviceCall({
      client: this.client.send(
        {
          cmd: VendorJobs.ADD_TO_PROJECT,
          uuid: projectId,
        },
        {
          ...projectPayload,
          vendor: vendorUser || null,
        }
      ),
      onSuccess: async (projectResponse) => {
        const createRes = await this.prisma.projectVendors.create({
          data: {
            projectId,
            vendorId,
            extras: {
              projectVendorIdentifier: projectResponse.id,
            },
          },
        });
        console.log('Vendor successfully assigned to the project:', createRes);
      },
      onError: (error) => {
        console.error('Error syncing vendor to project:', error);
      },
    });

    await handleMicroserviceCall({
      client: this.client.send(
        { cmd: 'rahat.jobs.projects.calculate_stats' },
        {
          projectUUID: projectId,
        }
      ),
      onSuccess(response) {
        console.log('Microservice response', response);
        return response;
      },
      onError(error) {
        throw new RpcException('Microservice call failed: ' + error.message);
      },
    });

    return response;
  }

  async getVendorAssignedToProject(vendorId: string, projectId: string) {
    return this.prisma.projectVendors.findUnique({
      where: { projectVendorIdentifier: { vendorId, projectId } },
      include: {
        User: true,
      },
    });
  }

  async getVendorCount() {
    return this.prisma.userRole.count({
      where: {
        Role: {
          name: UserRoles.VENDOR,
        },
      },
    });
  }

  async getVendor(id: UUID | Address) {
    const data = isAddress(id)
      ? await this.prisma.user.findFirst({ where: { wallet: id } })
      : await this.prisma.user.findUnique({ where: { uuid: id } });

    if (!data) {
      throw new NotFoundException(`Vendor not found with id: ${id}`);
    }

    const projectData = await this.prisma.projectVendors.findMany({
      where: { vendorId: data.uuid },
      include: {
        Project: true,
        User: true,
      },
    });
    // const vendorIdentifier = projectData[0]?.extras;
    // const projects = projectData.map((project) => project.Project);
    // const userdata = { ...data, projects, vendorIdentifier };
    return projectData;
  }

  async listVendor(dto) {
    const { projectName, status, page, perPage } = dto;
    const where: any = {
      Role: {
        name: UserRoles.VENDOR,
      },
      User: {
        deletedAt: null,
      },
    };

    if (projectName) {
      where.User = {
        ...where.User,
        VendorProject: {
          some: {
            Project: {
              name: projectName,
            },
          },
        },
      };
    }

    if (status) {
      if (status === 'Assigned') {
        where.User = {
          ...where.User,
          VendorProject: {
            some: {},
          },
        };
      } else if (status === 'Pending') {
        where.User = {
          ...where.User,
          VendorProject: {
            none: {},
          },
        };
      }
    }
    return paginate(
      this.prisma.userRole,
      {
        where,
        include: {
          User: {
            include: {
              VendorProject: {
                include: {
                  Project: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      {
        page,
        perPage,
      }
    );
  }

  async listProjectVendor(dto) {
    const { projectId } = dto;
    const q = {
      projectId,
      deletedAt: null,
    };
    if (dto.name) {
      q['User'] = {
        name: {
          contains: dto.name,
          mode: 'insensitive',
        },
      };
    }

    const venData = await this.prisma.projectVendors.findMany({
      where: q,
      include: {
        Project: true,
        User: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // return venData
    return this.client.send(
      {
        cmd: VendorJobs.LIST,
        uuid: projectId,
      },

      venData
    );
  }

  async listRedemptionVendor(data) {
    const uuids = data.data.map((item) => item.vendorId);
    const vendorData = await this.prisma.user.findMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
    });
    const combinedData = data.data.map((item) => {
      const matchedData = vendorData.find(
        (vendor) => vendor.uuid === item.vendorId
      );
      return {
        ...item,
        Vendor: {
          ...item.Vendor,
          ...matchedData,
        },
      };
    });
    return { data: combinedData, meta: data.meta };
  }

  async getOtp(dto: GetVendorOtp, rdetails) {
    return this.authService.getOtp(dto, rdetails);
  }

  async verifyOtp(dto, rdetails) {
    const res = await this.authService.loginByOtp(dto, rdetails);
    console.log(res);
    if (res.accessToken) {
      return this.getUserDetails(dto);
    }
  }

  async getUserDetails(dto) {
    const challengeData = decryptChallenge(
      getSecret(),
      dto.challenge,
      CONSTANTS.CLIENT_TOKEN_LIFETIME
    );
    if (!challengeData.address)
      throw new ForbiddenException('Invalid credentials in challenge!');
    if (!dto.service) {
      dto.service = getServiceTypeByAddress(challengeData.address) as Service;
    }
    const auth = await this.authService.getByServiceId(
      challengeData.address,
      dto.service as Service
    );

    const user = await this.authService.getUserById(auth.userId);
    return user;
  }

  async updateVendor(dto, uuid: UUID) {
    // STEP 1: Load current vendor state and validate it exists
    this.logger.log(`Starting vendor update for UUID: ${uuid} with data: ${JSON.stringify(dto)}`);
    const originalVendor = await this.prisma.user.findUnique({ where: { uuid } });
    if (!originalVendor) throw new NotFoundException('Vendor not found');

    // STEP 1.1: Validate email uniqueness if email is being updated
    if (dto?.email) {
      const duplicate = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { uuid } },
      });
      if (duplicate) throw new BadRequestException('Email must be unique');
    }

    // STEP 1.2: Merge extras with existing data to preserve unmodified fields
    if (dto.extras) {
      dto.extras = { ...Object(originalVendor.extras || {}), ...dto.extras };
    }

    // STEP 1.3: Capture a snapshot of original vendor (excluding system fields) for saga rollback
    const originalSnapshot = (({ id, uuid: _u, createdAt, updatedAt, ...rest }) => rest)(originalVendor);

    // STEP 2: Persist vendor update to the local database
    const result = await this.usersService.update(uuid, dto);

    // STEP 3: Fetch all projects this vendor is assigned to
    const assignedProjects = await this.prisma.projectVendors.findMany({
      where: { vendorId: uuid },
    });
    if (assignedProjects.length === 0) return result;

    // STEP 3.1: Touch updatedAt on all project-vendor links to signal a sync is in progress
    await this.prisma.projectVendors.updateMany({
      where: { vendorId: uuid },
      data: { updatedAt: new Date() },
    });

    // STEP 4: Propagate the update to each assigned project microservice (saga forward phase)
    const updatedProjects: string[] = [];

    for (const project of assignedProjects) {
      try {
        // STEP 4.1: Send vendor update to the project microservice
        this.logger.log(`Propagating vendor update to project ${project.projectId} for vendor UUID: ${uuid}`);
        await lastValueFrom(
          this.client.send({ cmd: VendorJobs.UPDATE, uuid: project.projectId }, { uuid, ...dto })
        );
        updatedProjects.push(project.projectId);
      } catch (error) {
        const err = error as Error;
        this.logger.error(`Saga failed at project ${project.projectId}: ${err.message}`);

        // STEP 4.2: Saga compensation — revert local vendor record to the original snapshot
        await this.revertVendorUpdate(originalSnapshot, uuid);

        // STEP 4.3: Saga compensation — re-send original snapshot to all previously updated projects
        await Promise.allSettled(
          updatedProjects.map((projectId) =>
            lastValueFrom(
              this.client.send({ cmd: VendorJobs.UPDATE, uuid: projectId }, { uuid, ...originalSnapshot })
            ).catch((e: Error) => this.logger.error(`Failed to revert project ${projectId}: ${e.message}`))
          )
        );

        throw new Error(`Vendor update saga failed at project ${project.projectId}: ${err.message}`);
      }
    }

    return result;
  }

  private async revertVendorUpdate(snapshot: Record<string, unknown>, uuid: string) {
    await this.prisma.user.update({ where: { uuid }, data: snapshot });
  }

  async removeVendor(uuid: UUID, projectId?: UUID) {
    const isVendor = await this.prisma.user.findFirst({
      where: {
        uuid,
      },
    });
    if (!isVendor) throw new Error('Data not Found');

    if (!projectId) {
      const result = await this.usersService.delete(uuid);
      return result;
    }

    const isProjectVendor = await this.prisma.projectVendors.findFirst({
      where: {
        projectId: projectId,
        vendorId: uuid,
      },
    });

    if (!isProjectVendor) throw new Error('Project vendor not found');

    await this.prisma.projectVendors.deleteMany({
      where: {
        projectId: projectId,
        vendorId: uuid,
      },
    });

    return this.client.send({ cmd: VendorJobs.REMOVE }, uuid);
  }

  async getVendorClaimStats(dto) {
    const { projectId } = dto;
    const projectVendors = await this.prisma.projectVendors.findMany({
      where: {
        projectId,
      },
      select: {
        User: true,
      },
    });
    return this.client.send(
      { cmd: VendorJobs.GET_VENDOR_STATS, uuid: projectId },
      projectVendors
    );
  }

  async getVendorByUuid(dto: { projectId: string; vendorId: string }) {
    return this.prisma.projectVendors.findUnique({
      where: {
        projectVendorIdentifier: dto,
      },
      include: {
        User: true,
      },
    });
  }
}
