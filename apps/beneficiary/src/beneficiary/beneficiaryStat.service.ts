// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { StatsService } from '@rahat/stats';
import { MS_TIMEOUT, ProjectContants } from '@rahataid/sdk';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { timeout } from 'rxjs';
import { hasKey } from '../utils/objectUtil';
import { RahatTokenAbi } from '../utils/rahatToken';
import { mapVulnerabilityStatusCount } from '../utils/vulnerabilityCountHelpers';
import { createContractReader } from '../utils/web3';
import { countBySSAType, countResult, FIELD_COMMUNICATION_CHANNEL, mapAgeGroupCounts, toPascalCase } from './helpers';

const REPORTING_FIELD = {
  FAMILY_MEMBER_BANK_ACCOUNT:
    'is_there_any_family_member_who_has_an_active_bank_account',
  TYPE_OF_PHONE_SET: 'type_of_phone_set',
};



@Injectable()
export class BeneficiaryStatService {
  constructor(
    protected prisma: PrismaService,
    private readonly statsService: StatsService,
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy
  ) { }

  async getTableStats() {
    return await this.prisma.stats.findMany({});
  }


  async calculateGenderStats(projectUuid?: string) {
    const filter: any = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryIds = await this.prisma.beneficiaryProject
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            beneficiaryId: true,
          },
        })
        .then((projectBen) => projectBen.map((data) => data?.beneficiaryId));

      if (beneficiaryIds.length > 0) {
        filter.uuid = { in: beneficiaryIds };
      }
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
    const filter: any = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryIds = await this.prisma.beneficiaryProject
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

      if (beneficiaryIds.length > 0) {
        filter.uuid = { in: beneficiaryIds };
      }
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
    const filter: any = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryIds = await this.prisma.beneficiaryProject
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            beneficiaryId: true,
          },
        })
        .then((projectBen) => projectBen.map((data) => data?.beneficiaryId));

      if (beneficiaryIds.length > 0) {
        filter.uuid = { in: beneficiaryIds };
      }
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

  async calculateBankedStatusStatsNew() {
    const data = await this.prisma.beneficiary.findMany({
      where: { deletedAt: null },
      select: {
        extras: true,
      },
    });

    let myData = {};

    for (let d of data) {
      const extras = d?.extras ?? null;
      if (
        extras &&
        hasKey(extras, REPORTING_FIELD.FAMILY_MEMBER_BANK_ACCOUNT) &&
        typeof extras[REPORTING_FIELD.FAMILY_MEMBER_BANK_ACCOUNT] ===
        'string' &&
        extras[REPORTING_FIELD.FAMILY_MEMBER_BANK_ACCOUNT]
          .toUpperCase()
          .trim() === 'YES'
      ) {
        if (myData['Banked']) {
          myData['Banked'] += 1;
        } else myData['Banked'] = 1;
      }
      if (
        extras &&
        extras &&
        hasKey(extras, REPORTING_FIELD.FAMILY_MEMBER_BANK_ACCOUNT) &&
        typeof extras[REPORTING_FIELD.FAMILY_MEMBER_BANK_ACCOUNT] ===
        'string' &&
        extras[REPORTING_FIELD.FAMILY_MEMBER_BANK_ACCOUNT]
          .toUpperCase()
          .trim() === 'NO'
      ) {
        if (myData['UnBanked']) {
          myData['UnBanked'] += 1;
        } else myData['UnBanked'] = 1;
      }
    }

    const result = Object.keys(myData).map((d) => ({
      id: d,
      count: myData[d],
    }));

    return result;
  }

  async calculateInternetStatusStats(projectUuid?: string) {
    const filter: any = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryIds = await this.prisma.beneficiaryProject
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

      if (beneficiaryIds.length > 0) {
        filter.uuid = { in: beneficiaryIds };
      }
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
    const filter: any = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryIds = await this.prisma.beneficiaryProject
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

      if (beneficiaryIds.length > 0) {
        filter.uuid = { in: beneficiaryIds };
      }
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
    const filter: any = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const beneficiaryIds = await this.prisma.beneficiaryProject
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
      if (beneficiaryIds.length > 0) {
        filter.uuid = { in: beneficiaryIds };
      }
    }
    const result = {
      count: await this.prisma.beneficiary.count({ where: filter }),
    };
    return result;
  }

  async totalVendors(projectUuid?: string) {
    let filter = {};

    // Add filter if projectUuid is provided
    if (projectUuid) {
      const vendorId = await this.prisma.projectVendors
        .findMany({
          where: {
            projectId: projectUuid,
          },
          select: {
            vendorId: true,
          },
        })
        .then((projectVen) =>
          projectVen.map((data: any) => data?.vendorId)
        );

      filter = {
        uuid: {
          in: vendorId || [],
        },
      };

    }

    // Todo: Calculate total
    return { count: await this.prisma.user.count({ where: filter }) };
  }

  async getTotalVoucher() {

    const settings = new SettingsService(this.prisma);
    const contractSettings = await settings.getByName('CONTRACTS')

    const rahatTokenAddress = contractSettings.value['RAHATTOKEN'].ADDRESS;

    const tokenContract = await createContractReader(RahatTokenAbi, rahatTokenAddress)

    return tokenContract.totalSupply();
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

    return beneficiaries?.map((b) => ({
      name: b?.pii?.name,
      latitude: b.latitude,
      longitude: b.longitude,
    }));
  }

  filterAndCountPhoneStatus(data) {
    const counts = data.reduce(
      (acc, record) => {
        const phoneNumber = record.phone;
        if (phoneNumber.startsWith('999')) {
          acc.unPhonedCount += 1;
        } else {
          acc.phonedCount += 1;
        }
        return acc;
      },
      { phonedCount: 0, unPhonedCount: 0 }
    );

    return [
      { id: 'Phoned', count: counts.phonedCount },
      { id: 'UnPhoned', count: counts.unPhonedCount },
    ];
  }

  async calculatePhoneTypeStats() {
    return await this.calculateExtrasStats(REPORTING_FIELD.TYPE_OF_PHONE_SET);
  }

  async calculateExtrasStats(fieldName: string) {
    const data = await this.prisma.beneficiary.findMany({
      where: {
        extras: { path: [fieldName], not: null },
      },
      select: { extras: true },
    });
    if (!data) return [];
    const myData = {};
    // Calculate count for each value
    data.forEach((item: any) => {
      const value = item.extras[fieldName];
      if (myData[value]) {
        myData[value] += 1;
      } else {
        myData[value] = 1;
      }
    });
    const result = Object.keys(myData).map((d) => ({
      id: d,
      count: myData[d],
    }));
    return result.filter((f) => f.id.toLocaleUpperCase() !== 'NO');
  }

  countByBank(array) {
    return array.reduce((result, currentValue) => {
      const bankValue = currentValue.extras.bank_name;
      if (bankValue) {
        if (!result[bankValue]) {
          result[bankValue] = 0;
        }
        result[bankValue]++;
      }
      return result;
    }, {});
  }
  async countExtrasFieldValuesNormalized(field: string, expected: string[]) {
    const results = await this.prisma.beneficiary.findMany({
      select: {
        extras: true,
      },
    });

    // Initialize counts with 0 for each expected value
    const counts: Record<string, number> = {};
    for (const key of expected) {
      counts[key] = 0;
    }

    for (const item of results) {
      const rawVal = item.extras?.[field];

      if (typeof rawVal === 'string') {
        const normalized = rawVal.trim().toLowerCase(); // Normalize
        if (expected.includes(normalized)) {
          counts[normalized] += 1;
        }
      }
    }

    return Object.entries(counts).map(([key, count]) => ({
      id: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize
      count,
    }));
  }

  async calculatePhoneAvailabilityStats() {
    const results = await this.prisma.beneficiaryPii.findMany({});
    const finalResult = this.filterAndCountPhoneStatus(results);
    return finalResult;
  }

  async calculateVulnerabilityCountStats() {
    const beneficiary = await this.prisma.beneficiary.findMany({
      where: { deletedAt: null },
    });
    const myData = mapVulnerabilityStatusCount(beneficiary);
    return Object.keys(myData).map((d) => ({
      id: d,
      count: myData[d],
    }));
  }

  async countByCaste(array) {
    return array.reduce((result, currentValue) => {
      const caste = currentValue?.extras?.caste;
      if (caste) {
        result[caste] = (result[caste] || 0) + 1;
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

    const casteCounts = await this.countByCaste(results);
    return Object.entries(casteCounts).map(([id, count]) => ({
      id,
      count,
    }));
  }
  async calculateChannelUsageStats() {
    // const fields = [
    //   'channelcommunity',
    //   'channelfm_radio',
    //   'channelmobile_phone___sms',
    //   'channelnewspaper',
    //   'channelothers',
    //   'channelpeople_representatives',
    //   'channelrelatives',
    //   'channelsocial_media',
    // ];

    const results = await this.prisma.beneficiary.findMany({
      select: {
        uuid: true,
        extras: true,
      },
    });

    const counts: Record<string, number> = {};

    for (const field of FIELD_COMMUNICATION_CHANNEL) {
      counts[field] = 0;
    }

    for (const item of results) {
      for (const field of FIELD_COMMUNICATION_CHANNEL) {
        if (item.extras?.[field] === 1) {
          counts[field] += 1;
        }
      }
    }

    return Object.entries(counts).map(([key, count]) => ({
      id: toPascalCase(key),
      count,
    }));
  }

  async vulnerableCountStats() {
    const benefs = await this.prisma.beneficiary.findMany();
    return countResult(benefs);
  }
  async accesstoEarlyWarningInformation() {
    return this.countExtrasFieldValuesNormalized('receive_disaster_info', [
      'yes',
      'no',
    ]);
  }

  async calculateBankStatusStats() {
    return this.countExtrasFieldValuesNormalized('have_active_bank_ac', [
      'yes',
      'no',
    ]);
  }

  async calculateSSARecipientInHH() {
    return this.countExtrasFieldValuesNormalized('ssa_recipient_in_hh', [
      'yes',
      'no',
    ]);
  }

  async accessToMobilePhones() {
    return this.countExtrasFieldValuesNormalized(
      'do_you_have_access_to_mobile_phones',
      ['yes', 'no']
    );
  }

  async accessInternet() {
    return this.countExtrasFieldValuesNormalized(
      'do_you_have_access_to_internet',
      ['yes', 'no']
    );
  }

  async digitalWalletUse() {
    return this.countExtrasFieldValuesNormalized('use_digital_wallets', [
      'yes',
      'no',
    ]);
  }

  async floadImpactIn5Years() {
    return this.countExtrasFieldValuesNormalized('flood_affected_in_5_years', [
      'yes',
      'no',
    ]);
  }
  async phoneTypeDistribution() {
    const rData = await this.countExtrasFieldValuesNormalized(
      'type_of_phone_set',
      ['smartphone', 'keypad', 'both', 'brick']
    );
    const result = [];

    let keypadBrickCount = 0;

    for (const item of rData) {
      if (item.id === 'Keypad' || item.id === 'Brick') {
        keypadBrickCount += item.count;
      } else {
        result.push(item);
      }
    }

    result.push({ id: 'Keypad/Brick', count: keypadBrickCount });

    return result;
  }

  async calculateAgeGroups() {
    const benef = await this.prisma.beneficiary.findMany({});
    const ageGroupCounts = mapAgeGroupCounts(benef);
    return Object.keys(ageGroupCounts).map((d) => ({
      id: d,
      count: ageGroupCounts[d],
    }));
  }
  async calculateTypeOfSSA() {
    const benef = await this.prisma.beneficiary.findMany({});
    const myData = countBySSAType(benef);
    return Object.keys(myData).map((d) => ({
      id: d,
      count: myData[d],
    }));
  }
  async calculateCountByBank() {
    const results = await this.prisma.beneficiary.findMany({
      where: {
        extras: {
          path: ['bank_name'],
          not: null || '',
        },
      },
      select: {
        uuid: true,
        extras: true,
      },
    });

    const bankCounts = this.countByBank(results);
    const resultArray = Object.keys(bankCounts).map((key) => {
      return {
        id: key,
        count: bankCounts[key],
      };
    });
    console.log(resultArray)
    return resultArray;
  }

  async calculateTotalFamilyMembers() {
    const benefs = await this.prisma.beneficiary.findMany();

    const total = benefs.reduce((sum, ben) => {
      const extras = ben.extras as {
        total_number_of_family_members?: number;
      };
      const members = Number(extras?.total_number_of_family_members || 0);
      return sum + members;
    }, 0);

    return { count: total };
  }
  async calculateAllStats() {
    const [
      gender,
      bankedStatus,
      bankedStatusNew,
      internetStatus,
      phoneStatus,
      total,
      calculateTotalFamilyMembers,
      age,
      mapStats,
      phoneAvailabilityStats,
      vulnerabilityCountStats,
      casteCountStats,
      phoneTypeStats,
      totalVendors,
      calculateChannelUsageStats,
      accessToMobilePhones,
      accessInternet,
      digitalWalletUse,
      phoneTypeDistribution,
      calculateSSARecipientInHH,
      floadImpactIn5Years,
      accesstoEarlyWarningInformation,
      vulnerableCountStats,
      calculateAgeGroups,
      calculateTypeOfSSA,
      calculateBankStatusStats,
      calculateCountByBank

    ] = await Promise.all([
      this.calculateGenderStats(),
      this.calculateBankedStatusStats(),
      this.calculateBankedStatusStatsNew(),
      this.calculateInternetStatusStats(),
      this.calculatePhoneStatusStats(),
      this.totalBeneficiaries(),
      this.calculateTotalFamilyMembers(),
      this.calculateAgeStats(),
      this.calculateMapStats(),
      this.calculatePhoneAvailabilityStats(),
      this.calculateVulnerabilityCountStats(),
      this.calculateCountByCasteStats(),
      this.calculatePhoneTypeStats(),
      this.totalVendors(),
      this.calculateChannelUsageStats(),
      this.accessToMobilePhones(),
      this.accessInternet(),
      this.digitalWalletUse(),
      this.phoneTypeDistribution(),
      this.calculateSSARecipientInHH(),
      this.floadImpactIn5Years(),
      this.accesstoEarlyWarningInformation(),
      this.vulnerableCountStats(),
      this.calculateAgeGroups(),
      this.calculateTypeOfSSA(),
      this.calculateBankStatusStats(),
      this.calculateCountByBank()

    ]);


    return {
      gender,
      bankedStatus,
      bankedStatusNew,
      internetStatus,
      phoneStatus,
      total,
      calculateTotalFamilyMembers,
      age,
      mapStats,
      phoneAvailabilityStats,
      vulnerabilityCountStats,
      casteCountStats,
      phoneTypeStats,
      totalVendors,
      calculateChannelUsageStats,
      accessToMobilePhones,
      accessInternet,
      digitalWalletUse,
      phoneTypeDistribution,
      calculateSSARecipientInHH,
      floadImpactIn5Years,
      accesstoEarlyWarningInformation,
      vulnerableCountStats,
      calculateAgeGroups,
      calculateTypeOfSSA,
      calculateBankStatusStats,
      calculateCountByBank

    };
  }
  async calculateProjectStats(projectUuid: string) {

    const [gender, bankedStatus, internetStatus, phoneStatus, total, age, totalVendors] =
      await Promise.all([
        this.calculateGenderStats(projectUuid),
        this.calculateBankedStatusStats(projectUuid),
        this.calculateInternetStatusStats(projectUuid),
        this.calculatePhoneStatusStats(projectUuid),
        this.totalBeneficiaries(projectUuid),
        this.calculateAgeStats(projectUuid),
        this.totalVendors(projectUuid),
      ]);

    return {
      gender,
      bankedStatus,
      internetStatus,
      phoneStatus,
      total,
      age,
      totalVendors,

    };
  }

  async getAllStats(group = 'beneficiary') {
    return this.statsService.getByGroup(group, {
      name: true,
      data: true,
    });
  }

  async calculateRangedAge(ages: any) {
    const range = [
      { id: '0-20', count: 0 },
      { id: '21-40', count: 0 },
      { id: '41-60', count: 0 },
      { id: '61-80', count: 0 },
      { id: '80+', count: 0 },
    ];

    ages.forEach((age) => {
      const { id, count } = age;
      if (id >= 0 && id <= 20) {
        range[0].count += count;
      }
      if (id >= 21 && id <= 40) {
        range[1].count += count;
      }
      if (id >= 41 && id <= 60) {
        range[2].count += count;
      }
      if (id >= 61 && id <= 80) {
        range[3].count += count;
      }
      if (id > 80) {
        range[4].count += count;
      }
    });

    return range;
  }

  async saveAllStats(projectUuid?: string) {
    const {
      gender,
      bankedStatus,
      bankedStatusNew,
      internetStatus,
      phoneStatus,
      total,
      calculateTotalFamilyMembers,
      age,
      mapStats,
      phoneAvailabilityStats,
      vulnerabilityCountStats,
      casteCountStats,
      phoneTypeStats,
      totalVendors,
      calculateChannelUsageStats,
      accessToMobilePhones,
      accessInternet,
      digitalWalletUse,
      phoneTypeDistribution,
      calculateSSARecipientInHH,
      floadImpactIn5Years,
      accesstoEarlyWarningInformation,
      vulnerableCountStats,
      calculateAgeGroups,
      calculateTypeOfSSA,
      calculateBankStatusStats,
      calculateCountByBank

    } = await this.calculateAllStats();

    const rangedAge = await this.calculateRangedAge(age);

    await Promise.all([
      this.statsService.save({
        name: 'beneficiary_total',
        data: total,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'total_number_family_members',
        data: calculateTotalFamilyMembers,
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
        name: 'beneficiary_bankedStatus_new',
        data: bankedStatusNew,
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
      this.statsService.save({
        name: 'beneficiary_phone_type_stats',
        data: phoneTypeStats,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'vendor_total',
        data: totalVendors,
        group: 'vendor'
      }),
      this.statsService.save({
        name: 'channel_usage_stats',
        data: calculateChannelUsageStats,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'mobile_access',
        data: accessToMobilePhones,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'internet_access',
        data: accessInternet,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'digital_wallet_use',
        data: digitalWalletUse,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'type_of_phone',
        data: phoneTypeDistribution,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'social_security_linked_to_bank_account',
        data: calculateSSARecipientInHH,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'flood_impact_in_last_5years',
        data: floadImpactIn5Years,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'acces_to_early_warning_information',
        data: accesstoEarlyWarningInformation,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'vulnerable_count_stats',
        data: vulnerableCountStats,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'age_groups',
        data: calculateAgeGroups,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'household_receiving_social_protection_benefits',
        data: calculateTypeOfSSA,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'bank_account_access',
        data: calculateBankStatusStats,
        group: 'beneficiary',
      }),
      this.statsService.save({
        name: 'bank_count_stats',
        data: calculateCountByBank,
        group: 'beneficiary',
      }),
    ]);

    if (projectUuid) {
      const { gender, bankedStatus, internetStatus, phoneStatus, total, age, totalVendors } =
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
        this.statsService.save({
          name: 'vendor_total',
          data: totalVendors,
          group: projectUuid
        }),
        //PROJECT VOUCHER SHOULD BE CALCUATED IN PROJECT
        // this.statsService.save({
        //   name: 'voucher_total',
        //   data: await this.getTotalVoucher(),
        //   group: projectUuid
        // })
      ]);


      const projectStats = await this.client.send({ cmd: "rahat.jobs.reporting.list", uuid: projectUuid }, {})
        .pipe(timeout(MS_TIMEOUT)).toPromise();

      projectStats.forEach((stat) => {
        this.statsService.save({
          name: stat.name,
          data: stat.data,
          group: projectUuid
        })
      })
    }

    return { gender, bankedStatus, internetStatus, phoneStatus, total };
  }
}

