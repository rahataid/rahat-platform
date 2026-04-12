import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';

type SeriesEntry = { label: string; value: number };

type ExtraStat = {
  key: string;
  label: string;
  classification: 'boolean' | 'numeric' | 'status' | 'category';
  chart: 'pie' | 'bar' | 'metric';
  coverage: { nonNull: number; pct: number };
  series: SeriesEntry[];
  summary?: { count: number; min: number; max: number; avg: number };
};

type KeyAccumulator = {
  nonNullCount: number;
  uniqueValues: Map<string, number>;
  numericCount: number;
  min: number;
  max: number;
  sum: number;
};

const EXTRAS_DENY_LIST = new Set([
  'validPhoneNumber',
  'validBankAccount',
  'error',
  'bank_ac_name',
  'bank_ac_number',
  'transportId',
  'url',
  'appId',
  'walletAddress',
]);

const BOOLEAN_VALUES = new Set(['yes', 'no', 'true', 'false', '1', '0']);

const UNIQUE_VALUES_CAP = 100;
const TOP_K = 10;
const MIN_NON_NULL_COUNT = 5;

/**
 * Flattens nested object to dot-path keys.
 * { address: { city: 'NY' } } → { 'address.city': 'NY' }
 */
function flattenExtras(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      val !== null &&
      val !== undefined &&
      typeof val === 'object' &&
      !Array.isArray(val)
    ) {
      Object.assign(result, flattenExtras(val as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

function keyToLabel(key: string): string {
  const segment = key.split('.').pop() ?? key;
  return segment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function isBooleanClassification(acc: KeyAccumulator): boolean {
  if (acc.nonNullCount < 1) return false;
  for (const key of acc.uniqueValues.keys()) {
    if (!BOOLEAN_VALUES.has(key.toLowerCase().trim())) return false;
  }
  return true;
}

function isIdentifierKey(key: string): boolean {
  return /phone|account|id|address|wallet|transport/i.test(key);
}

function looksLikeEnumValues(values: Map<string, number>): boolean {
  let enumLike = 0;
  for (const k of values.keys()) {
    if (/^[A-Z][A-Z0-9_]*$/.test(k)) enumLike++;
  }
  return enumLike / values.size >= 0.7;
}

/**
 * Classifies an extras key using priority heuristics:
 * boolean → numeric → status → category → null (skip high-cardinality free text).
 */
function classifyKey(
  key: string,
  acc: KeyAccumulator,
  total: number,
): 'boolean' | 'numeric' | 'status' | 'category' | null {
  if (EXTRAS_DENY_LIST.has(key)) return null;

  const pct = total > 0 ? (acc.nonNullCount / total) * 100 : 0;
  if (acc.nonNullCount < MIN_NON_NULL_COUNT && pct < 5) return null;
  if (acc.nonNullCount === 0) return null;

  if (isBooleanClassification(acc)) return 'boolean';

  const uniqueRatio = acc.uniqueValues.size / acc.nonNullCount;

  if (
    acc.numericCount === acc.nonNullCount &&
    uniqueRatio < 0.8 &&
    !isIdentifierKey(key)
  ) {
    return 'numeric';
  }

  const hasStatusKeyword = /status|state|type/.test(key.toLowerCase());

  if (
    acc.uniqueValues.size <= 12 &&
    (looksLikeEnumValues(acc.uniqueValues) || hasStatusKeyword)
  ) {
    return 'status';
  }

  if (acc.uniqueValues.size <= 30) return 'category';

  return null;
}

function buildSeries(
  acc: KeyAccumulator,
  chart: 'pie' | 'bar' | 'metric',
): SeriesEntry[] {
  const entries: SeriesEntry[] = [];
  for (const [label, value] of acc.uniqueValues.entries()) {
    entries.push({ label, value });
  }
  entries.sort((a, b) => b.value - a.value);

  if (chart === 'bar' && entries.length > TOP_K) {
    const topEntries = entries.slice(0, TOP_K);
    const otherCount = entries.slice(TOP_K).reduce((s, e) => s + e.value, 0);
    if (otherCount > 0) topEntries.push({ label: 'Other', value: otherCount });
    return topEntries;
  }

  return entries;
}

function ageToRange(age: number): string {
  if (age <= 20) return '0-20';
  if (age <= 40) return '21-40';
  if (age <= 60) return '41-60';
  if (age <= 80) return '61-80';
  return '80+';
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      beneficiaryTotal,
      vendorTotal,
      genderStats,
      ageRangeStats,
      bankedStatusStats,
      internetStatusStats,
      phoneStatusStats,
      extrasRows,
      projects,
    ] = await Promise.all([
      this.prisma.beneficiary.count({ where: { deletedAt: null } }),

      this.prisma.vendors.count({ where: { deletedAt: null } }),

      this.prisma.beneficiary.groupBy({
        by: ['gender'],
        _count: { gender: true },
        where: { deletedAt: null },
      }),

      this.prisma.beneficiary.groupBy({
        by: ['age'],
        _count: { age: true },
        where: { deletedAt: null, age: { not: null } },
      }),

      this.prisma.beneficiary.groupBy({
        by: ['bankedStatus'],
        _count: { bankedStatus: true },
        where: { deletedAt: null },
      }),

      this.prisma.beneficiary.groupBy({
        by: ['internetStatus'],
        _count: { internetStatus: true },
        where: { deletedAt: null },
      }),

      this.prisma.beneficiary.groupBy({
        by: ['phoneStatus'],
        _count: { phoneStatus: true },
        where: { deletedAt: null },
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

    const beneficiary_gender: SeriesEntry[] = genderStats.map((s) => ({
      label: String(s.gender),
      value: s._count.gender,
    }));

    const ageRangeBuckets: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '80+': 0,
    };
    for (const stat of ageRangeStats) {
      if (stat.age !== null && stat.age !== undefined) {
        const bucket = ageToRange(stat.age);
        ageRangeBuckets[bucket] = (ageRangeBuckets[bucket] ?? 0) + stat._count.age;
      }
    }
    const beneficiary_age_range: SeriesEntry[] = Object.entries(ageRangeBuckets).map(
      ([label, value]) => ({ label, value }),
    );

    const beneficiary_bankedStatus: SeriesEntry[] = bankedStatusStats.map((s) => ({
      label: String(s.bankedStatus),
      value: s._count.bankedStatus,
    }));

    const beneficiary_internetStatus: SeriesEntry[] = internetStatusStats.map((s) => ({
      label: String(s.internetStatus),
      value: s._count.internetStatus,
    }));

    const beneficiary_phoneStatus: SeriesEntry[] = phoneStatusStats.map((s) => ({
      label: String(s.phoneStatus),
      value: s._count.phoneStatus,
    }));

    const extraStats = this.discoverExtrasStats(extrasRows, beneficiaryTotal);

    const projectList = projects.map((p) => ({
      uuid: p.uuid,
      name: p.name,
      type: p.type,
      status: String(p.status),
      createdAt: p.createdAt.toISOString(),
      description: p.description ?? '',
    }));

    return {
      scope: { beneficiaryCount: beneficiaryTotal },
      coreStats: {
        beneficiary_total: { count: beneficiaryTotal },
        vendor_total: { count: vendorTotal },
        beneficiary_gender,
        beneficiary_age_range,
        beneficiary_bankedStatus,
        beneficiary_internetStatus,
        beneficiary_phoneStatus,
      },
      extraStats,
      projects: projectList,
    };
  }

  /**
   * Single-pass scan over all extras rows. Caps unique-value tracking at
   * UNIQUE_VALUES_CAP to bound memory on high-cardinality string fields.
   */
  private discoverExtrasStats(
    rows: Array<{ extras: unknown }>,
    total: number,
  ): ExtraStat[] {
    const accumulators = new Map<string, KeyAccumulator>();

    const getOrCreate = (key: string): KeyAccumulator => {
      let acc = accumulators.get(key);
      if (!acc) {
        acc = {
          nonNullCount: 0,
          uniqueValues: new Map(),
          numericCount: 0,
          min: Infinity,
          max: -Infinity,
          sum: 0,
        };
        accumulators.set(key, acc);
      }
      return acc;
    };

    for (const row of rows) {
      if (!row.extras || typeof row.extras !== 'object') continue;
      const flat = flattenExtras(row.extras as Record<string, unknown>);

      for (const [key, rawVal] of Object.entries(flat)) {
        if (rawVal === null || rawVal === undefined || rawVal === '') continue;

        const acc = getOrCreate(key);
        acc.nonNullCount++;

        const strVal = String(rawVal).trim();

        if (acc.uniqueValues.size < UNIQUE_VALUES_CAP) {
          acc.uniqueValues.set(strVal, (acc.uniqueValues.get(strVal) ?? 0) + 1);
        } else if (acc.uniqueValues.has(strVal)) {
          acc.uniqueValues.set(strVal, (acc.uniqueValues.get(strVal) ?? 0) + 1);
        }

        const numVal = Number(rawVal);
        if (!isNaN(numVal) && rawVal !== '' && rawVal !== true && rawVal !== false) {
          acc.numericCount++;
          if (numVal < acc.min) acc.min = numVal;
          if (numVal > acc.max) acc.max = numVal;
          acc.sum += numVal;
        }
      }
    }

    const result: ExtraStat[] = [];

    for (const [key, acc] of accumulators.entries()) {
      const classification = classifyKey(key, acc, total);
      if (classification === null) continue;

      const pct = total > 0 ? Math.round((acc.nonNullCount / total) * 10000) / 100 : 0;

      let chart: 'pie' | 'bar' | 'metric';
      if (classification === 'boolean') {
        chart = 'pie';
      } else if (classification === 'numeric') {
        chart = 'metric';
      } else {
        chart = acc.uniqueValues.size <= 6 ? 'pie' : 'bar';
      }

      const series = buildSeries(acc, chart);
      if (series.length === 0) continue;

      const stat: ExtraStat = {
        key,
        label: keyToLabel(key),
        classification,
        chart,
        coverage: { nonNull: acc.nonNullCount, pct },
        series,
      };

      if (classification === 'numeric' && acc.numericCount > 0) {
        stat.summary = {
          count: acc.numericCount,
          min: acc.min,
          max: acc.max,
          avg: Math.round((acc.sum / acc.numericCount) * 100) / 100,
        };
      }

      result.push(stat);
    }

    result.sort((a, b) => b.coverage.nonNull - a.coverage.nonNull);

    return result;
  }
}
