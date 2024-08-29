import { Injectable } from '@nestjs/common';
import { StatsService } from '@rahat/stats';
import { PrismaService } from '@rumsan/prisma';
import { mapVulnerabilityStatusCount } from '../utils/vulnerabilityCountHelpers';

@Injectable()
export class BeneficiaryStatService {
  constructor(
    protected prisma: PrismaService,
    private readonly statsService: StatsService
  ) {}

  async getTableStats() {
    return await this.prisma.stats.findMany({});
  }

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

  async calculateAgeStats(projectUuid?: string) {
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

    const ageStats = await this.prisma.beneficiary.groupBy({
      by: ['age'],
      _count: {
        age: true,
      },
      where: filter,
    });

    return ageStats.map((stat) => ({
      id: stat.age,
      count: stat._count.age,
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

  async calculateMapStats() {
    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        deletedAt: null,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: { pii: true },
    });
    const data = beneficiaries?.map((b) => ({
      name: b.pii.name,
      latitude: b.latitude,
      longitude: b.longitude,
    }));

    return data;
  }

  filterAndCountPhoneStatus(data) {
    let unPhonedCount = 0;
    let phonedCount = 0;

    data.forEach((record) => {
      const phoneNumber = record.phone;
      if (phoneNumber.startsWith('999')) {
        unPhonedCount += 1;
      } else {
        phonedCount += 1;
      }
    });

    return [
      { id: 'Phoned', count: phonedCount },
      { id: 'UnPhoned', count: unPhonedCount },
    ];
  }

  async calculatePhoneAvailabilityStats() {
    const results = await this.prisma.beneficiaryPii.findMany({});
    const finalResult = this.filterAndCountPhoneStatus(results);
    return finalResult;
  }

  async calculateVulnerabilityCountStats() {
    const benef = await this.prisma.beneficiary.findMany({
      where: { deletedAt: null },
    });
    const myData = mapVulnerabilityStatusCount(benef);
    return Object.keys(myData).map((d) => ({
      id: d,
      count: myData[d],
    }));
  }

  countByCaste(array) {
    return array.reduce((result, currentValue) => {
      const casteValue = currentValue.extras.caste;
      if (casteValue) {
        if (!result[casteValue]) {
          result[casteValue] = 0;
        }
        result[casteValue]++;
      }
      return result;
    }, {});
  }

  async calculateCountByCasteStats() {
    const results = await this.prisma.beneficiary.findMany({
      where: {
        extras: {
          path: ['caste'],
          not: null || '',
        },
      },
      select: {
        uuid: true,
        extras: true,
      },
    });

    const casteCounts = this.countByCaste(results);
    const resultArray = Object.keys(casteCounts).map((key) => {
      return {
        id: key,
        count: casteCounts[key],
      };
    });
    return resultArray;
  }

  async calculateAllStats() {
    const [
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
      total,
      age,
      mapStats,
      phoneAvailabilityStats,
      vulnerabilityCountStats,
      casteCountStats,
    ] = await Promise.all([
      this.calculateGenderStats(),
      this.calculateBankedStatusStats(),
      this.calculateInternetStatusStats(),
      this.calculatePhoneStatusStats(),
      this.totalBeneficiaries(),
      this.calculateAgeStats(),
      this.calculateMapStats(),
      this.calculatePhoneAvailabilityStats(),
      this.calculateVulnerabilityCountStats(),
      this.calculateCountByCasteStats(),
    ]);

    return {
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
      total,
      age,
      mapStats,
      phoneAvailabilityStats,
      vulnerabilityCountStats,
      casteCountStats,
    };
  }
  async calculateProjectStats(projectUuid: string) {
    const [gender, bankedStatus, internetStatus, phoneStatus, total, age] =
      await Promise.all([
        this.calculateGenderStats(projectUuid),
        this.calculateBankedStatusStats(projectUuid),
        this.calculateInternetStatusStats(projectUuid),
        this.calculatePhoneStatusStats(projectUuid),
        this.totalBeneficiaries(projectUuid),
        this.calculateAgeStats(projectUuid),
      ]);

    return {
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
      total,
      age,
    };
  }

  async getAllStats(group = 'beneficiary') {
    return this.statsService.getByGroup(group, {
      name: true,
      data: true,
    });
  }

  async calculateRangedAge(ages: any) {
    let range = [
      { id: '0-20', count: 0 },
      { id: '20-40', count: 0 },
      { id: '40-60', count: 0 },
      { id: '60+', count: 0 },
    ];
    ages.map((age) => {
      if (age.id >= 0 && age.id <= 20) {
        range[0].count = range[0].count + age.count;
      }
      if (age.id > 20 && age.id <= 40) {
        range[1].count = range[1].count + age.count;
      }
      if (age.id > 40 && age.id <= 60) {
        range[2].count = range[2].count + age.count;
      }
      if (age.id > 60) {
        range[3].count = range[3].count + age.count;
      }
    });

    return range;
  }

  async saveAllStats(projectUuid?: string) {
    const {
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
      total,
      age,
      mapStats,
      phoneAvailabilityStats,
      vulnerabilityCountStats,
      casteCountStats,
    } = await this.calculateAllStats();

    const rangedAge = await this.calculateRangedAge(age);

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
      this.statsService.save({
        name: 'beneficiary_age_range',
        data: rangedAge,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_map_stats',
        data: mapStats,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_phone_availability_stats',
        data: phoneAvailabilityStats,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_vulnerability_count_stats',
        data: vulnerabilityCountStats,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'beneficiary_caste_count_stats',
        data: casteCountStats,
        group: 'beneficiary',
      }),
    ]);
    if (projectUuid) {
      const { gender, bankedStatus, internetStatus, phoneStatus, total, age } =
        await this.calculateProjectStats(projectUuid);
      const rangedAge = await this.calculateRangedAge(age);
      await Promise.all([
        this.statsService.save({
          name: 'beneficiary_total',
          data: total,
          group: projectUuid,
        }),
        this.statsService.save({
          name: 'beneficiary_gender',
          data: gender,
          group: projectUuid,
        }),
        this.statsService.save({
          name: 'beneficiary_bankedStatus',
          data: bankedStatus,
          group: projectUuid,
        }),
        this.statsService.save({
          name: 'beneficiary_internetStatus',
          data: internetStatus,
          group: projectUuid,
        }),
        this.statsService.save({
          name: 'beneficiary_phoneStatus',
          data: phoneStatus,
          group: projectUuid,
        }),
        this.statsService.save({
          name: 'beneficiary_age_range',
          data: rangedAge,
          group: projectUuid,
        }),
      ]);
    }

    return { gender, bankedStatus, internetStatus, phoneStatus };
  }
}
