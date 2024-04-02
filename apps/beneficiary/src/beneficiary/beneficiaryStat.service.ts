import { Injectable } from '@nestjs/common';
import { StatsService } from '@rahat/stats';
import { PrismaService } from '@rumsan/prisma';

@Injectable()
export class BeneficiaryStatService {
  constructor(
    protected prisma: PrismaService,
    private readonly statsService: StatsService
  ) {}

  async calculateGenderStats(projectUuid?: string) {
    let filter = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      filter = {
        projectUuid: {
          equals: projectUuid,
        },
      };
    }

    const genderStats = await this.prisma.beneficiary.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
      where: filter,
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

  async totalBeneficiaries() {
    return { count: await this.prisma.beneficiary.count() };
  }

  async calculateAllStats(projectUuid?: string) {
    const [gender, bankedStatus, internetStatus, phoneStatus, total] =
      await Promise.all([
        this.calculateGenderStats(projectUuid),
        this.calculateBankedStatusStats(),
        this.calculateInternetStatusStats(),
        this.calculatePhoneStatusStats(),
        this.totalBeneficiaries(),
      ]);

    return {
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
      total,
    };
  }

  async getAllStats() {
    return this.statsService.getByGroup('beneficiary', {
      name: true,
      data: true,
    });
  }

  async saveAllStats(projectUuid?: string) {
    const { gender, bankedStatus, internetStatus, phoneStatus, total } =
      await this.calculateAllStats(projectUuid);

    await Promise.all([
      this.statsService.save({
        name: 'beneficiary_total',
        data: total,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_gender',
        data: gender,
        group: 'beneficiary',
        projectUuid,
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
