import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';

@Injectable()
export class DashboardService {
  private readonly requiredStatNames = [
    'beneficiary_total',
    'vendor_total',
    'total_number_family_members',
    'beneficiary_gender',
    'beneficiary_age_range',
    'age_groups',
    'beneficiary_bankedStatus',
    'beneficiary_internetStatus',
    'beneficiary_phoneStatus',
    'bank_account_access',
    'beneficiary_map_stats',
    'beneficiary_vulnerability_count_stats',
    'vulnerable_count_stats',
    'flood_impact_in_last_5years',
    'acces_to_early_warning_information',
    'type_of_phone',
    'mobile_access',
    'internet_access',
    'digital_wallet_use',
    'beneficiary_caste_count_stats',
    'channel_usage_stats',
    'beneficiary_phone_type_stats',
    'beneficiary_phone_availability_stats',
    'social_security_linked_to_bank_account',
    'household_receiving_social_protection_benefits',
    'bank_count_stats',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [statsRows, projects] = await Promise.all([
      this.prisma.stats.findMany({
        where: { name: { in: this.requiredStatNames } },
        select: { name: true, data: true },
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

    const stats = Object.fromEntries(
      statsRows.map((r) => [r.name, r.data]),
    );

    return { stats, projects };
  }
}
