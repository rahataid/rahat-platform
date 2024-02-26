import { Injectable } from '@nestjs/common';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { PrismaService } from '@rumsan/prisma';
import { UserRoles } from '../constants';

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
        service: dto.service,
        serviceId: dto[service.toLocaleLowerCase()],
        details: dto.extras,
      },
    });
    return user;
  }
}
