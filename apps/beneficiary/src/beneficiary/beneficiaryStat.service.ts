import { Injectable } from '@nestjs/common';
import { StatsService } from '@rahat/stats';
import { PrismaService } from '@rumsan/prisma';

@Injectable()
export class BeneficiaryStatService {
  constructor(
    protected prisma: PrismaService,
    private readonly statsService: StatsService
  ) {}

  async calculateGenderStats() {
    const genderStats = await this.prisma.beneficiary.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
    });

    return genderStats.map((stat) => ({
      id: stat.gender,
      count: stat._count.gender,
    }));
  }

  async calculateBankedStatusStats() {
    const bankedStatusStats = await this.prisma.beneficiary.groupBy({
      by: ['bankedStatus'],
      _count: {
        bankedStatus: true,
      },
    });

    return bankedStatusStats.map((stat) => ({
      id: stat.bankedStatus,
      count: stat._count.bankedStatus,
    }));
  }

  async calculateInternetStatusStats() {
    const internetStatusStats = await this.prisma.beneficiary.groupBy({
      by: ['internetStatus'],
      _count: {
        internetStatus: true,
      },
    });

    return internetStatusStats.map((stat) => ({
      id: stat.internetStatus,
      count: stat._count.internetStatus,
    }));
  }

  async calculatePhoneStatusStats() {
    const phoneStatusStats = await this.prisma.beneficiary.groupBy({
      by: ['phoneStatus'],
      _count: {
        phoneStatus: true,
      },
    });

    return phoneStatusStats.map((stat) => ({
      id: stat.phoneStatus,
      count: stat._count.phoneStatus,
    }));
  }

  async calculateAllStats() {
    const [gender, bankedStatus, internetStatus, phoneStatus] =
      await Promise.all([
        this.calculateGenderStats(),
        this.calculateBankedStatusStats(),
        this.calculateInternetStatusStats(),
        this.calculatePhoneStatusStats(),
      ]);

    return {
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
    };
  }

  async getAllStats() {
    return this.statsService.getByGroup('beneficiary', {
      name: true,
      data: true,
    });
  }

  async saveAllStats() {
    const { gender, bankedStatus, internetStatus, phoneStatus } =
      await this.calculateAllStats();

    await Promise.all([
      this.statsService.save({
        name: 'beneficiary_gender',
        data: gender,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_bankedStatus',
        data: bankedStatus,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_internetStatus',
        data: internetStatus,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_phoneStatus',
        data: phoneStatus,
        group: 'beneficiary',
      }),
    ]);
    return { gender, bankedStatus, internetStatus, phoneStatus };
  }
}
