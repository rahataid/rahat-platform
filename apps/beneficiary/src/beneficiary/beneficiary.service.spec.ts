import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiaryService } from './beneficiary.module';
import { PrismaService } from '@rumsan/prisma';

describe('findOne', () => {
  let service: BeneficiaryService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiaryService,
        {
          provide: PrismaService,
          useValue: {
            beneficiary: {
              findUnique: jest.fn()
            },
            beneficiaryPii: {
              findUnique: jest.fn()
            }
          }
        }
      ],
    }).compile();

    service = module.get<BeneficiaryService>(BeneficiaryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('display beneficiary detail', async () => {
    const uuid = '7ce001c8-2336-4a6e-8f57-7e952dafb9bc';
    const mockBeneficiary = {id: 1, uuid, BeneficiaryProject: []};
    const mockPiiData = {beneficiaryId: 1, phone: '9898'};

    (prismaService.beneficiary.findUnique as jest.Mock).mockResolvedValue(mockBeneficiary);
    (prismaService.beneficiaryPii.findUnique as jest.Mock).mockResolvedValue(mockPiiData);
    
    const result = await service.findOne(uuid);

    expect(prismaService.beneficiary.findUnique).toHaveBeenCalledWith({
      where: {uuid},
      include: {
        BeneficiaryProject: {
          include: {
            Project: true
          }
        }
      }
    });
    expect(prismaService.beneficiaryPii.findUnique).toHaveBeenCalledWith({
      where: {beneficiaryId: mockBeneficiary.id}
    });
    expect(result).toEqual({...mockBeneficiary, piiData: mockPiiData});
  });
});
