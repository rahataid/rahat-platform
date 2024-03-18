import { Injectable } from '@nestjs/common';
import { VendorAddToProjectDto, VendorRegisterDto } from '@rahataid/extensions';
import { UserRoles } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  //TODO: Fix allow duplicate users?
  async registerVendor(dto: VendorRegisterDto) {
    const role = await this.prisma.role.findFirst({
      where: { name: UserRoles.VENDOR },
    });
    if (!role) throw new Error('Role not found');
    // Add to User table
    const { service, ...rest } = dto;
    const user = await this.prisma.user.create({ data: rest });
    // Add to UserRole table
    const userRolePayload = { userId: user.id, roleId: role.id };
    await this.prisma.userRole.create({ data: userRolePayload });
    // Add to Auth table
    await this.prisma.auth.create({
      data: {
        userId: +user.id,
        service: dto.service as any,
        serviceId: dto[service.toLocaleLowerCase()],
        details: dto.extras,
      },
    });
    return user;
  }

  async assignToProject(dto:VendorAddToProjectDto){
    const {vendorUuid} = dto;
    const vendorUser = await this.prisma.user.findUnique({where:{uuid:vendorUuid}});
    const userRoles = await this.prisma.userRole.findMany({where:{userId:vendorUser.id},include:{
      Role:{
        select:{name:true}
      }

    }});
    const isVendor = userRoles.some((userRole)=>userRole.Role.name === UserRoles.VENDOR)
    const projectPayload ={
      uuid:vendorUuid,
      walletAddress:vendorUser.wallet
    }
    
  }
}
