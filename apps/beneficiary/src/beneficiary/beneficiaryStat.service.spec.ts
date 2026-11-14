import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from '@rahat/stats';
import { ProjectContants } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { BeneficiaryStatService } from './beneficiaryStat.service';

describe('BeneficiaryStatService', () => {
  let service: BeneficiaryStatService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiaryStatService,
        {
          provide: PrismaService,
          useValue: {
            beneficiary: {
              groupBy: jest.fn().mockResolvedValue([]),
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
            },
            beneficiaryProject: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            beneficiaryPii: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: StatsService,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: ProjectContants.ELClient,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BeneficiaryStatService>(BeneficiaryStatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('excludes removed beneficiaries from global gender statistics', async () => {
    await service.calculateGenderStats();

    expect(prisma.beneficiary.groupBy).toHaveBeenCalledWith({
      by: ['gender'],
      _count: {
        gender: true,
      },
      where: {
        deletedAt: null,
      },
    });
  });

  it('returns empty project statistics instead of including all beneficiaries', async () => {
    await service.calculateGenderStats('project-uuid');

    expect(prisma.beneficiaryProject.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 'project-uuid',
        deletedAt: null,
      },
      select: {
        beneficiaryId: true,
      },
    });
    expect(prisma.beneficiary.groupBy).toHaveBeenCalledWith({
      by: ['gender'],
      _count: {
        gender: true,
      },
      where: {
        deletedAt: null,
        uuid: {
          in: [],
        },
      },
    });
  });

  it('excludes removed beneficiaries from extras-based statistics', async () => {
    await service.calculateExtrasStats('type_of_phone_set');

    expect(prisma.beneficiary.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        extras: {
          path: ['type_of_phone_set'],
          not: null,
        },
      },
      select: {
        extras: true,
      },
    });
  });

  it('excludes removed beneficiaries from phone availability statistics', async () => {
    await service.calculatePhoneAvailabilityStats();

    expect(prisma.beneficiaryPii.findMany).toHaveBeenCalledWith({
      where: {
        beneficiary: {
          deletedAt: null,
        },
      },
    });
  });
});
