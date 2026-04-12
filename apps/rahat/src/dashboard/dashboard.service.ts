import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';

// ── Helper constants (replicated from beneficiary helpers) ──────────────

const AGE_GROUPS = {
  BELOW_20: '<20',
  AGE_19_TO_29: '20-29',
  AGE_30_TO_45: '30-45',
  AGE_46_TO_59: '46-59',
  ABOVE_60: '>60',
};

const TYPE_OF_SSA = {
  SENIOR_CITIZEN_ABOVE_70: 'senior_citizen__70',
  SENIOR_CITIZEN_DALIT_ABOVE_60: 'senior_citizen__60__dalit',
  CHILD_NUTRITION: 'child_nutrition',
  SINGLE_WOMEN: 'single_woman',
  WIDOW: 'widow',
  RED_CARD: 'red_class',
  BLUE_CARD: 'blue_card',
  INDIGENOUS_COMMUNITY: 'indigenous_community',
};

const FIELD_MAP = {
  NO_OF_LACTATING_WOMEN: 'no_of_lactating_women',
  NO_OF_PERSONS_WITH_DISABILITY: 'no_of_persons_with_disability',
  NO_OF_PREGNANT_WOMEN: 'no_of_pregnant_women',
};

const FIELD_COMMUNICATION_CHANNEL = [
  'channelcommunity',
  'channelfm_radio',
  'channelmobile_phone___sms',
  'channelnewspaper',
  'channelothers',
  'channelpeople_representatives',
  'channelrelatives',
  'channelsocial_media',
];

const VULNERABILITY_FIELD = {
  HOW_MANY_LACTATING: 'if_yes_how_many_lactating',
  HOW_MANY_PREGNANT: 'if_yes_how_many_pregnant',
  TYPE_OF_SSA_1: 'type_of_ssa_1',
  TYPE_OF_SSA_2: 'type_of_ssa_2',
  TYPE_OF_SSA_3: 'type_of_ssa_3',
};

// ── Helper functions ────────────────────────────────────────────────────

function toPascalCase(input: string): string {
  return input
    .replace(/^channel/, '')
    .replace(/_+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function getAgeGroup(age: number): string {
  if (age < 20) return AGE_GROUPS.BELOW_20;
  if (age >= 20 && age <= 29) return AGE_GROUPS.AGE_19_TO_29;
  if (age >= 30 && age <= 45) return AGE_GROUPS.AGE_30_TO_45;
  if (age >= 46 && age <= 59) return AGE_GROUPS.AGE_46_TO_59;
  return AGE_GROUPS.ABOVE_60;
}

function mapAgeGroupCounts(data: any[]): Array<{ id: string; count: number }> {
  const counts: Record<string, number> = {
    [AGE_GROUPS.BELOW_20]: 0,
    [AGE_GROUPS.AGE_19_TO_29]: 0,
    [AGE_GROUPS.AGE_30_TO_45]: 0,
    [AGE_GROUPS.AGE_46_TO_59]: 0,
    [AGE_GROUPS.ABOVE_60]: 0,
  };

  for (const item of data) {
    const age = item?.extras?.interviewee_age;
    if (typeof age === 'number') {
      const group = getAgeGroup(age);
      counts[group]++;
    }
  }

  return Object.entries(counts).map(([id, count]) => ({ id, count }));
}

function countResult(data: any[]): Record<string, number> {
  const counts: Record<string, number> = {
    [FIELD_MAP.NO_OF_LACTATING_WOMEN]: 0,
    [FIELD_MAP.NO_OF_PERSONS_WITH_DISABILITY]: 0,
    [FIELD_MAP.NO_OF_PREGNANT_WOMEN]: 0,
  };

  for (const item of data) {
    const extras = item.extras || {};
    for (const field of Object.values(FIELD_MAP)) {
      const rawVal = extras[field];
      if (rawVal === '' || rawVal === '-' || rawVal == null) continue;
      const val = parseInt(rawVal);
      if (!isNaN(val) && val > 0) {
        counts[field] += val;
      }
    }
  }
  return counts;
}

function countBySSAType(
  data: any[],
): Array<{ id: string; count: number }> {
  const counts: Record<string, number> = {};
  Object.values(TYPE_OF_SSA).forEach((val) => {
    counts[val] = 0;
  });

  for (const item of data) {
    const ssaType = item?.extras?.type_of_ssa;
    if (!ssaType || ssaType === '-') continue;
    if (Object.values(TYPE_OF_SSA).includes(ssaType)) {
      counts[ssaType] = (counts[ssaType] || 0) + 1;
    }
  }

  return Object.entries(counts).map(([id, count]) => ({ id, count }));
}

function mapVulnerabilityStatusCount(
  data: any[],
): Array<{ id: string; count: number }> {
  const myData: Record<string, number> = {};

  const incrementCount = (key: string, count = 1) => {
    if (key) {
      myData[key] = (myData[key] || 0) + count;
    }
  };

  for (const d of data) {
    const extras = d?.extras ?? {};
    incrementCount(
      'Lactating',
      +extras[VULNERABILITY_FIELD.HOW_MANY_LACTATING] || 0,
    );
    incrementCount(
      'Pregnant',
      +extras[VULNERABILITY_FIELD.HOW_MANY_PREGNANT] || 0,
    );
    incrementCount(extras[VULNERABILITY_FIELD.TYPE_OF_SSA_1]);
    incrementCount(extras[VULNERABILITY_FIELD.TYPE_OF_SSA_2]);
    incrementCount(extras[VULNERABILITY_FIELD.TYPE_OF_SSA_3]);
  }

  return Object.entries(myData).map(([id, count]) => ({ id, count }));
}

// ── Service ─────────────────────────────────────────────────────────────

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    // Fetch all beneficiaries ONCE (used by many stats)
    const [allBeneficiaries, allBeneficiariesWithExtras, projects] =
      await Promise.all([
        this.prisma.beneficiary.findMany({
          where: { deletedAt: null },
          select: { id: true, extras: true, age: true },
        }),
        this.prisma.beneficiary.findMany({
          where: { deletedAt: null },
          select: { extras: true },
        }),
        this.prisma.project.findMany({
          select: {
            uuid: true,
            name: true,
            type: true,
            status: true,
            createdAt: true,
            description: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Run all stat calculations in parallel
    const [
      beneficiaryTotal,
      vendorTotal,
      genderStats,
      ageRangeStats,
      bankedStatusStats,
      internetStatusStats,
      phoneStatusStats,
      mapStats,
      phoneAvailabilityStats,
      casteCountStats,
      bankCountStats,
      channelUsageStats,
    ] = await Promise.all([
      // beneficiary_total
      this.prisma.beneficiary.count({ where: { deletedAt: null } }),
      // vendor_total — uses User model via ProjectVendors (matches existing behavior)
      this.prisma.user.count(),
      // beneficiary_gender
      this.prisma.beneficiary.groupBy({
        by: ['gender'],
        _count: { gender: true },
        where: { deletedAt: null },
      }),
      // beneficiary_age_range
      this.prisma.beneficiary.groupBy({
        by: ['age'],
        _count: { age: true },
        where: { deletedAt: null },
      }),
      // beneficiary_bankedStatus
      this.prisma.beneficiary.groupBy({
        by: ['bankedStatus'],
        _count: { bankedStatus: true },
        where: { deletedAt: null },
      }),
      // beneficiary_internetStatus
      this.prisma.beneficiary.groupBy({
        by: ['internetStatus'],
        _count: { internetStatus: true },
        where: { deletedAt: null },
      }),
      // beneficiary_phoneStatus
      this.prisma.beneficiary.groupBy({
        by: ['phoneStatus'],
        _count: { phoneStatus: true },
        where: { deletedAt: null },
      }),
      // beneficiary_map_stats
      this.prisma.beneficiary.findMany({
        where: {
          deletedAt: null,
          latitude: { not: null },
          longitude: { not: null },
        },
        include: { pii: true },
      }),
      // beneficiary_phone_availability_stats
      this.prisma.beneficiaryPii.findMany({
        select: { phone: true },
      }),
      // beneficiary_caste_count_stats
      this.prisma.beneficiary.findMany({
        where: {
          extras: { path: ['caste'], not: null },
        },
        select: { extras: true },
      }),
      // bank_count_stats
      this.prisma.beneficiary.findMany({
        where: {
          extras: { path: ['bank_name'], not: null },
        },
        select: { extras: true },
      }),
      // channel_usage_stats (needs extras)
      Promise.resolve(null), // computed from allBeneficiariesWithExtras below
    ]);

    // ── Transform Prisma results into stat shapes ───────────────────────

    // beneficiary_gender: [{id, count}]
    const beneficiary_gender = genderStats.map((s) => ({
      id: s.gender,
      count: s._count.gender,
    }));

    // beneficiary_age_range: [{id, count}] — bucketed
    const ageRange = [
      { id: '0-20', count: 0 },
      { id: '21-40', count: 0 },
      { id: '41-60', count: 0 },
      { id: '61-80', count: 0 },
      { id: '80+', count: 0 },
    ];
    for (const stat of ageRangeStats) {
      const age = stat.age;
      const count = stat._count.age;
      if (age >= 0 && age <= 20) ageRange[0].count += count;
      else if (age >= 21 && age <= 40) ageRange[1].count += count;
      else if (age >= 41 && age <= 60) ageRange[2].count += count;
      else if (age >= 61 && age <= 80) ageRange[3].count += count;
      else if (age > 80) ageRange[4].count += count;
    }

    // beneficiary_bankedStatus: [{id, count}]
    const beneficiary_bankedStatus = bankedStatusStats.map((s) => ({
      id: s.bankedStatus,
      count: s._count.bankedStatus,
    }));

    // beneficiary_internetStatus: [{id, count}]
    const beneficiary_internetStatus = internetStatusStats.map((s) => ({
      id: s.internetStatus,
      count: s._count.internetStatus,
    }));

    // beneficiary_phoneStatus: [{id, count}]
    const beneficiary_phoneStatus = phoneStatusStats.map((s) => ({
      id: s.phoneStatus,
      count: s._count.phoneStatus,
    }));

    // beneficiary_map_stats: [{name, latitude, longitude}]
    const beneficiary_map_stats = mapStats.map((b) => ({
      name: b?.pii?.name,
      latitude: b.latitude,
      longitude: b.longitude,
    }));

    // beneficiary_phone_availability_stats: [{id, count}]
    let phonedCount = 0;
    let unPhonedCount = 0;
    for (const record of phoneAvailabilityStats) {
      if (record.phone?.startsWith('999')) {
        unPhonedCount++;
      } else {
        phonedCount++;
      }
    }
    const beneficiary_phone_availability_stats = [
      { id: 'Phoned', count: phonedCount },
      { id: 'UnPhoned', count: unPhonedCount },
    ];

    // beneficiary_caste_count_stats: [{id, count}]
    const casteCounts: Record<string, number> = {};
    for (const item of casteCountStats) {
      const caste = (item.extras as any)?.caste;
      if (caste) {
        casteCounts[caste] = (casteCounts[caste] || 0) + 1;
      }
    }
    const beneficiary_caste_count_stats = Object.entries(casteCounts).map(
      ([id, count]) => ({ id, count }),
    );

    // bank_count_stats: [{id, count}]
    const bankCounts: Record<string, number> = {};
    for (const item of bankCountStats) {
      const bankName = (item.extras as any)?.bank_name;
      if (bankName) {
        bankCounts[bankName] = (bankCounts[bankName] || 0) + 1;
      }
    }
    const bank_count_stats = Object.entries(bankCounts).map(
      ([id, count]) => ({ id, count }),
    );

    // channel_usage_stats: [{id, count}]
    const channelCounts: Record<string, number> = {};
    for (const field of FIELD_COMMUNICATION_CHANNEL) {
      channelCounts[field] = 0;
    }
    for (const item of allBeneficiariesWithExtras) {
      for (const field of FIELD_COMMUNICATION_CHANNEL) {
        if ((item.extras as any)?.[field] === 1) {
          channelCounts[field]++;
        }
      }
    }
    const channel_usage_stats = Object.entries(channelCounts).map(
      ([key, count]) => ({ id: toPascalCase(key), count }),
    );

    // ── Extras-based yes/no stats ───────────────────────────────────────

    const extrasData = allBeneficiariesWithExtras;

    const bank_account_access = this.countExtrasYesNo(
      extrasData,
      'have_active_bank_ac',
    );
    const social_security_linked_to_bank_account = this.countExtrasYesNo(
      extrasData,
      'ssa_recipient_in_hh',
    );
    const mobile_access = this.countExtrasYesNo(
      extrasData,
      'do_you_have_access_to_mobile_phones',
    );
    const internet_access = this.countExtrasYesNo(
      extrasData,
      'do_you_have_access_to_internet',
    );
    const digital_wallet_use = this.countExtrasYesNo(
      extrasData,
      'use_digital_wallets',
    );
    const flood_impact_in_last_5years = this.countExtrasYesNo(
      extrasData,
      'flood_affected_in_5_years',
    );
    const acces_to_early_warning_information = this.countExtrasYesNo(
      extrasData,
      'receive_disaster_info',
    );

    // ── Phone type stats ────────────────────────────────────────────────

    const phoneTypeCounts: Record<string, number> = {
      smartphone: 0,
      keypad: 0,
      both: 0,
      brick: 0,
    };
    for (const item of extrasData) {
      const rawVal = (item.extras as any)?.type_of_phone_set;
      if (typeof rawVal === 'string') {
        const normalized = rawVal.trim().toLowerCase();
        if (normalized in phoneTypeCounts) {
          phoneTypeCounts[normalized]++;
        }
      }
    }
    // beneficiary_phone_type_stats — raw values (excluding 'no')
    const beneficiary_phone_type_stats = Object.entries(phoneTypeCounts)
      .filter(([key]) => key.toUpperCase() !== 'NO')
      .map(([id, count]) => ({
        id: id.charAt(0).toUpperCase() + id.slice(1),
        count,
      }));

    // type_of_phone — merged keypad/brick
    const type_of_phone: Array<{ id: string; count: number }> = [];
    let keypadBrickCount = 0;
    for (const [key, count] of Object.entries(phoneTypeCounts)) {
      if (key === 'keypad' || key === 'brick') {
        keypadBrickCount += count;
      } else {
        type_of_phone.push({
          id: key.charAt(0).toUpperCase() + key.slice(1),
          count,
        });
      }
    }
    type_of_phone.push({ id: 'Keypad/Brick', count: keypadBrickCount });

    // ── Complex stats from full beneficiary data ────────────────────────

    const age_groups = mapAgeGroupCounts(allBeneficiaries);

    const vulnerable_count_stats = countResult(allBeneficiaries);

    const beneficiary_vulnerability_count_stats =
      mapVulnerabilityStatusCount(allBeneficiaries);

    const household_receiving_social_protection_benefits =
      countBySSAType(allBeneficiaries);

    // total_number_family_members
    let totalFamilyMembers = 0;
    for (const ben of allBeneficiaries) {
      const members = Number(
        (ben.extras as any)?.total_number_of_family_members || 0,
      );
      totalFamilyMembers += members;
    }

    // ── Assemble final stats object ─────────────────────────────────────

    const stats: Record<string, any> = {
      beneficiary_total: { count: beneficiaryTotal },
      vendor_total: { count: vendorTotal },
      total_number_family_members: { count: totalFamilyMembers },
      beneficiary_gender,
      beneficiary_age_range: ageRange,
      age_groups,
      beneficiary_bankedStatus,
      beneficiary_internetStatus,
      beneficiary_phoneStatus,
      beneficiary_map_stats,
      beneficiary_phone_availability_stats,
      beneficiary_vulnerability_count_stats,
      vulnerable_count_stats,
      beneficiary_caste_count_stats,
      beneficiary_phone_type_stats,
      type_of_phone,
      channel_usage_stats,
      bank_account_access,
      social_security_linked_to_bank_account,
      mobile_access,
      internet_access,
      digital_wallet_use,
      flood_impact_in_last_5years,
      acces_to_early_warning_information,
      household_receiving_social_protection_benefits,
      bank_count_stats,
    };

    return { stats, projects };
  }

  // ── Private helpers ───────────────────────────────────────────────────

  /**
   * Count yes/no values for a given extras field across all beneficiaries.
   * Returns [{id: 'Yes', count: N}, {id: 'No', count: N}]
   */
  private countExtrasYesNo(
    data: Array<{ extras: any }>,
    field: string,
  ): Array<{ id: string; count: number }> {
    let yesCount = 0;
    let noCount = 0;

    for (const item of data) {
      const rawVal = item.extras?.[field];
      if (typeof rawVal === 'string') {
        const normalized = rawVal.trim().toLowerCase();
        if (normalized === 'yes') yesCount++;
        else if (normalized === 'no') noCount++;
      }
    }

    return [
      { id: 'Yes', count: yesCount },
      { id: 'No', count: noCount },
    ];
  }
}
