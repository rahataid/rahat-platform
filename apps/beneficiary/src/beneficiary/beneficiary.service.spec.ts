import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiaryService } from './beneficiary.service';
import { PrismaService } from '@rumsan/prisma';
import { PaginatorTypes, paginator } from '@rumsan/prisma';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });
jest.mock('paginate');

describe('BeneficiaryService', () => {
  let service: BeneficiaryService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiaryService,
        {
          provide: PrismaService,
          useValue: {
            beneficiaryProject: {
              create: jest.fn()
            },
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

  describe('addToProject', () => {
    it('should add beneficiary to the project', () => {
      const dto = {
        id: 1,
        uuid: '1',
        projectId: '1',
        beneficiaryId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      const createdBeneficiaryProject = {
        id: 1,
        ...dto
      };

      jest.spyOn(prismaService.beneficiaryProject, 'create').mockResolvedValue(createdBeneficiaryProject);
      const result = service.addToProject(dto);
      expect(result).toEqual(createdBeneficiaryProject);
      expect(prismaService.beneficiaryProject.create).toHaveBeenCalledWith({
        data: dto,
      });
    })
  });

  // describe('listPiiDate', () => {
  //   it('should return list of Pii data with project id', async () => {
  //     // const dto = {
  //     //   projectId: 1,
  //     // };
  //     const repository = service.rsprisma.beneficiaryProject
  //     repository.count.mockResolvedValue(2);
  //     paginate.mockResolvedValue(data);
  //   });
  // });
  
  describe('listBenefByProject', () => {
    it('should return list of beneficiaries with project id', async () => {
      const data = [{projectId: 1, beneficiaryId: 1}]
      const result = await service.mergeProjectData(data);
      
      expect(result).toBeDefined();
    });
  });
});
