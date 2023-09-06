import { Injectable } from '@nestjs/common';
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
}
