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
      const beneficiaryId = await this.prisma.beneficiaryProject
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            beneficiaryId: true,
          },
        })
        .then((projectBen) =>
          projectBen.map((data: any) => data?.beneficiaryId)
        );

      filter = {
        uuid: {
          in: beneficiaryId || [],
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

  async calculateBankedStatusStats(projectUuid?: string) {
    let filter = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryId = await this.prisma.beneficiaryProject
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            beneficiaryId: true,
          },
        })
        .then((projectBen) =>
          projectBen.map((data: any) => data?.beneficiaryId)
        );

      filter = {
        uuid: {
          in: beneficiaryId || [],
        },
      };
    }
    const bankedStatusStats = await this.prisma.beneficiary.groupBy({
      by: ['bankedStatus'],
      _count: {
        bankedStatus: true,
      },
      where: filter,
    });

    return bankedStatusStats.map((stat) => ({
      id: stat.bankedStatus,
      count: stat._count.bankedStatus,
    }));
  }

  async calculateInternetStatusStats(projectUuid?: string) {
    let filter = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryId = await this.prisma.beneficiaryProject
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            beneficiaryId: true,
          },
        })
        .then((projectBen) =>
          projectBen.map((data: any) => data?.beneficiaryId)
        );

      filter = {
        uuid: {
          in: beneficiaryId || [],
        },
      };
    }

    const internetStatusStats = await this.prisma.beneficiary.groupBy({
      by: ['internetStatus'],
      _count: {
        internetStatus: true,
      },
      where: filter,
    });

    return internetStatusStats.map((stat) => ({
      id: stat.internetStatus,
      count: stat._count.internetStatus,
    }));
  }

  async calculatePhoneStatusStats(projectUuid?: string) {
    let filter = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryId = await this.prisma.beneficiaryProject
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            beneficiaryId: true,
          },
        })
        .then((projectBen) =>
          projectBen.map((data: any) => data?.beneficiaryId)
        );

      filter = {
        uuid: {
          in: beneficiaryId || [],
        },
      };
    }
    const phoneStatusStats = await this.prisma.beneficiary.groupBy({
      by: ['phoneStatus'],
      _count: {
        phoneStatus: true,
      },
      where: filter,
    });

    return phoneStatusStats.map((stat) => ({
      id: stat.phoneStatus,
      count: stat._count.phoneStatus,
    }));
  }

  async totalBeneficiaries(projectUuid?: string) {
    let filter = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryId = await this.prisma.beneficiaryProject
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            beneficiaryId: true,
          },
        })
        .then((projectBen) =>
          projectBen.map((data: any) => data?.beneficiaryId)
        );

      filter = {
        uuid: {
          in: beneficiaryId || [],
        },
      };
    }
    return { count: await this.prisma.beneficiary.count({ where: filter }) };
  }

  async calculateAllStats(projectUuid?: string) {
    const [gender, bankedStatus, internetStatus, phoneStatus, total] =
      await Promise.all([
        this.calculateGenderStats(projectUuid),
        this.calculateBankedStatusStats(projectUuid),
        this.calculateInternetStatusStats(projectUuid),
        this.calculatePhoneStatusStats(projectUuid),
        this.totalBeneficiaries(projectUuid),
      ]);

    return {
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
      total,
    };
  }

  async getAllStats(group = 'beneficiary') {
    return this.statsService.getByGroup(group, {
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
        group: projectUuid ? projectUuid : 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_gender',
        data: gender,
        group: projectUuid ? projectUuid : 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_bankedStatus',
        data: bankedStatus,
        group: projectUuid ? projectUuid : 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_internetStatus',
        data: internetStatus,
        group: projectUuid ? projectUuid : 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_phoneStatus',
        data: phoneStatus,
        group: projectUuid ? projectUuid : 'beneficiary',
      }),
    ]);
    return { gender, bankedStatus, internetStatus, phoneStatus };
  }
}
