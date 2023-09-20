import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate } from '@utils/paginate';
import { PrismaService } from 'nestjs-prisma';
import { CreateAppSettingDto, GetSettingsByNameDto } from './app-settings.dto';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  createAppSettings(createAppSettingsDto: CreateAppSettingDto) {
    return this.prisma.appSettings.create({
      data: createAppSettingsDto,
    });
  }

  getAppSettings(query: GetSettingsByNameDto) {
    const { name } = query;
    const where: Prisma.AppSettingsWhereInput = {};
    if (name) {
      where.name = {
        contains: name,
      };
    }

    return paginate(
      this.prisma.appSettings,
      { where },
      { page: 1, perPage: 100 },
    );
  }

  getContracts() {
    console.log('INSIDE GET CONTRACTS');
    return this.prisma.appSettings.findFirstOrThrow({
      where: {
        name: 'CONTRACT_ADDRESS',
      },
      select: {
        name: true,
        value: true,
      },
    });
  }
  getBlockchain() {
    return this.prisma.appSettings.findFirstOrThrow({
      where: {
        name: 'BLOCKCHAIN',
      },
      select: {
        name: true,
        value: true,
      },
    });
  }

  async getContractByName(contractName: string) {
    const addresses = await this.prisma.appSettings.findMany({
      where: {
        name: 'CONTRACT_ADDRESS',
      },
    });

    const address = addresses[0].value[contractName];
    if (!address) {
      throw new Error(`Contract ${contractName} not found.`);
    }

    return address;
  }
}
