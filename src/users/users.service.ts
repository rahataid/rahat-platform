import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { PrismaService } from 'src/prisma/prisma.service';
import { bufferToHexString, hexStringToBuffer } from 'src/utils/string-format';
import { ListUserDto } from './dto/list-user.dto';
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

  async findAll(query: ListUserDto) {
    const { perPage, page, ...rest } = query;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      isActive: true,
    };
    const select: Prisma.UserSelect = {
      name: true,
      roles: true,
      email: true,
      profileImage: true,
      isApproved: true,
      walletAddress: true,
      id: true,
    };
    if (rest.name) {
      where.name = {
        contains: rest.name,
        mode: 'insensitive',
      };
    }

    return paginate(
      this.prisma.user,
      { where, select },
      {
        page,
        perPage,
        transformRows: (rows) =>
          rows.map((r) => ({
            ...r,
            walletAddress: bufferToHexString(r.walletAddress),
            roles: r.roles.join(', '),
          })),
      },
    );
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

    const updatedUser = await this.prisma.user.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        roles: [role as Role],
      },
    });

    return updatedUser;
  }
}
