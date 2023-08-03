import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { bufferToHexString, hexStringToBuffer } from '@utils/string-format';
import { PrismaService } from 'nestjs-prisma';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUserDto } from './dto/list-user.dto';
import { RequestUserOtpDto, VerifyUserOtpDto } from './dto/login-user.dto';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const data = {
      ...createUserDto,
      walletAddress: hexStringToBuffer(createUserDto.walletAddress),
      roles: {
        connect: {
          name: 'User',
        },
      },
    };

    if (createUserDto.role) {
      data.roles.connect = {
        name: createUserDto.role,
      };
    }
    delete data?.role;

    const user = await this.prisma.user.create({
      data,
    });

    return {
      ...user,
      walletAddress: bufferToHexString(user.walletAddress),
    };
  }
  async register(registerUserData: CreateUserDto) {
    console.log('registerUserData', registerUserData);
    const data = {
      ...registerUserData,
      walletAddress: hexStringToBuffer(registerUserData.walletAddress),
      roles: {
        connect: {
          name: 'User',
        },
      },
    };

    if (registerUserData.role) {
      data.roles.connect = {
        name: registerUserData.role,
      };
    }

    const user = await this.prisma.user.create({
      data,
    });

    return {
      ...user,
      walletAddress: bufferToHexString(user.walletAddress),
    };
  }

  findAll(query: ListUserDto) {
    const { perPage, page, ...rest } = query;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };
    const select: Prisma.UserSelect = {
      name: true,
      roles: {
        select: {
          name: true,
        },
      },
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
            roles: r.roles.map((role) => role.name).join(', '),
          })),
      },
    );
  }

  async findOne(walletAddress: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
    });
    return {
      ...user,
      walletAddress: bufferToHexString(user.walletAddress),
    };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const walletAddress = hexStringToBuffer(updateUserDto.walletAddress);
    return this.prisma.user.update({
      where: {
        id,
      },
      data: { ...updateUserDto, walletAddress },
    });
  }

  approve(walletAddress: string) {
    return this.prisma.user.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        isApproved: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async requestOtp(requestOtpDto: RequestUserOtpDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        email: requestOtpDto.email,
      },
    });

    return {
      user,
      msg: 'Otp sent to the user email',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyUserOtpDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        email: verifyOtpDto.email,
      },
    });

    return {
      user,
      token: 1234,
      // privateKey: PRIVATE_KEYS_ADMIN.privateKey,
    };
  }

  async updateRole(
    walletAddress: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const { role } = updateUserRoleDto;

    const user = await this.prisma.user.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        roles: {
          connect: {
            name: role,
          },
        },
      },
    });

    return user;
  }
}
