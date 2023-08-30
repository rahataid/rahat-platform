import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { hexStringToBuffer } from 'src/utils/string-format';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly _logger = new Logger('User Services');

  constructor(private prisma: PrismaService) {}

  async register(createUserDto: CreateUserDto) {
    this._logger.log(`Registering new user: ${createUserDto?.email}`);
    const walletAddress = hexStringToBuffer(createUserDto?.walletAddress);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        walletAddress,
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    this._logger.log(`Creating new user: ${createUserDto?.email}`);
    const walletAddress = hexStringToBuffer(createUserDto?.walletAddress);
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        walletAddress,
      },
    });
  }

  async findAll() {
    this._logger.log(`Finding all users`);
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    this._logger.log(`Finding user by ID: ${id}`);
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    this._logger.log(`Updating user by ID: ${id}`);
    const walletAddress = hexStringToBuffer(updateUserDto?.walletAddress);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        walletAddress,
      },
    });
  }

  async approve(walletAddress: string) {
    return this.prisma.user.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        isApproved: true,
      },
    });
  }

  async remove(id: number) {
    this._logger.log(`Setting isActive to false for user with ID: ${id}`);

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async findOneByEmail(email: string): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateRole(
    walletAddress: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const { role } = updateUserRoleDto;

    const user = await this.prisma.user.findUnique({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      select: {
        roles: true,
      },
    });

    if (!user) {
      return null;
    }

    const updatedRoles = [...user.roles, role as Role];

    const updatedUser = await this.prisma.user.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        roles: updatedRoles,
      },
    });

    return updatedUser;
  }
}
