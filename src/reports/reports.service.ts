import { Injectable } from '@nestjs/common';
import { hexStringToBuffer } from '@utils/string-format';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    // return 'report';
    let totalBeneficiaries: number;
    let totalProjects: number;
    let totalTokens;

    await this.prisma.$transaction(async (transaction) => {
      totalBeneficiaries = await transaction.beneficiary.count();
      totalTokens = await transaction.project.aggregate({
        _sum: {
          disbursed: true,
        },
      });
      totalProjects = await transaction.project.count();
    });

    return {
      totalBeneficiaries,
      totalTokens: totalTokens._sum.disbursed,
      totalProjects,
    };
  }

  async getProjectBasedReport(contractAddress: string) {
    const buffferAddress = hexStringToBuffer(contractAddress);

    const result = await this.prisma.project.findUnique({
      where: {
        contractAddress: buffferAddress,
      },

      select: {
        beneficiaries: {
          select: {
            gender: true,
            bankStatus: true,
            internetAccess: true,
            phoneOwnership: true,
          },
        },
        budget: true,
        disbursed: true,
        _count: true,
      },
    });

    const beneficiaries = result?.beneficiaries;
    const meta = result?._count;
    const budget = result?.budget;
    const token = result?.disbursed;

    // Initialize counters for each status
    const genderCounts = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
      UNKNOWN: 0,
    };

    const bankStatusCounts = {
      UNKNOWN: 0,
      UNBANKED: 0,
      BANKED: 0,
      UNDERBANKED: 0,
    };

    const internetAccessCounts = {
      UNKNOWN: 0,
      NO_INTERNET: 0,
      PHONE_INTERNET: 0,
      HOME_INTERNET: 0,
    };

    const phoneOwnershipCounts = {
      UNKNOWN: 0,
      NO_PHONE: 0,
      FEATURE: 0,
      SMART: 0,
    };

    beneficiaries?.forEach((beneficiary) => {
      genderCounts[beneficiary.gender]++;

      bankStatusCounts[beneficiary.bankStatus]++;

      internetAccessCounts[beneficiary.internetAccess]++;

      phoneOwnershipCounts[beneficiary.phoneOwnership]++;
    });

    return {
      genderCounts,
      bankStatusCounts,
      internetAccessCounts,
      phoneOwnershipCounts,
      meta,
      budget,
      token,
    };
  }
}
