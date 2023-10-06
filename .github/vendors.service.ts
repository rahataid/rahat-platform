import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { bufferToHexString, hexStringToBuffer } from '@utils/string-format';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { ListVendorDto } from './dto/list-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async create(createVendorDto: CreateVendorDto) {
    const vendor = await this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        walletAddress: hexStringToBuffer(createVendorDto.walletAddress),
        address: JSON.stringify(createVendorDto.address),
      },
    });
    return {
      ...vendor,
      walletAddress: bufferToHexString(vendor.walletAddress),
    };
  }

  findAll(query: ListVendorDto) {
    const { page, perPage, ...rest } = query;

    const where: Prisma.VendorWhereInput = { deletedAt: null };
    if (rest.name) {
      where.name = {
        contains: rest.name,
        mode: 'insensitive',
      };
    }

    if (rest.phone) {
      where.phone = {
        contains: rest.phone,
        mode: 'insensitive',
      };
    }

    if (rest.walletAddress) {
      where.walletAddress = hexStringToBuffer(rest.walletAddress);
    }
    const select: Prisma.VendorSelect = {
      name: true,
      walletAddress: true,
      isApproved: true,
      isActive: true,
      _count: {
        select: {
          projects: true,
        },
      },
      // projects: {
      //   select: {
      //     name: true,
      //     id: true,
      //   },
      // },
    };

    return paginate(
      this.prisma.vendor,
      { where, select },
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

  async findOne(walletAddress: string) {
    const data = await this.prisma.vendor.findUniqueOrThrow({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      select: {
        address: true,
        name: true,
        phone: true,
        walletAddress: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
        deletedAt: true,
        updatedAt: true,
        email: true,
        id: true,
        projects: {
          select: {
            name: true,
            id: true,
            isApproved: true,
            owner: {
              select: {
                name: true,
                id: true,
              },
            },
            projectType: true,
          },
        },
        _count: true,
      },
    });

    return {
      ...data,
      walletAddress: bufferToHexString(data.walletAddress),
    };
  }

  update(walletAddress: string, updateVendorDto: UpdateVendorDto) {
    return this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        ...updateVendorDto,
        walletAddress: hexStringToBuffer(updateVendorDto.walletAddress),
      },
    });
  }

  remove(walletAddress: string) {
    return this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  approval(walletAddress: string) {
    return this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        isApproved: true,
      },
    });
  }

  async changeVendorState(walletAddress: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
    });
    const updateVendor = await this.prisma.vendor.update({
      where: {
        walletAddress: hexStringToBuffer(walletAddress),
      },
      data: {
        isActive: !vendor.isActive,
      },
      select: {
        isActive: true,
      },
    });

    return updateVendor.isActive;
  }

  register(registerVendorDto: any) {
    console.log('INSIDE REGISTER VENDOR FUNCTION');
    return 'This registers vendors';
  }
}
