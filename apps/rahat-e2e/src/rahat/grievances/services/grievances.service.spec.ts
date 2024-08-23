import { Test, TestingModule } from '@nestjs/testing';
import { GrievanceService } from '../../../../../rahat/src/grievance/grievance.service';
import { PrismaService } from '@rumsan/prisma';
import { GrievanceStatus } from '@prisma/client';
import { createGrievanceDTO, expectedGrievance, updatedGrievance, userId } from './testFixtureData';
import { ChangeGrievanceStatusDTO, CreateGrievanceDTO } from '@rahataid/extensions';

describe('GrievanceService', () => {
  let service: GrievanceService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrievanceService,
        {
          provide: PrismaService,
          useValue: {
            grievance: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GrievanceService>(GrievanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a new grievance', async () => {
    (prisma.grievance.create as jest.Mock).mockResolvedValue(expectedGrievance);
    const result = await service.createGrievance(createGrievanceDTO, userId);
    expect(prisma.grievance.create).toHaveBeenCalledWith({
      data: {
        title: createGrievanceDTO.title,
        description: createGrievanceDTO.description,
        reporterContact: createGrievanceDTO.reporterContact,
        type: createGrievanceDTO.type,
        reportedBy: createGrievanceDTO.reportedBy,
          project: {
            connect: {
              uuid: createGrievanceDTO.projectId,
            },
          },
          reporterUser: {
            connect: {
              id: userId,
            },
          },
          status: GrievanceStatus.NEW
      }
    })
    expect(result).toEqual(expectedGrievance);
  }); 

  it('should update the grievance status', async () => {
    const uuid  = process.env.GRIEVANCE_UUID;
    const data = { status: 'NEW' } as ChangeGrievanceStatusDTO;
    jest.spyOn(prisma.grievance, 'update').mockResolvedValue(updatedGrievance);
    const result = await service.changeStatus(uuid, data);
    console.log(result, 'result');
    expect(prisma.grievance.update).toHaveBeenCalledWith({
      where: {uuid},
      data: {status: data.status}
    });
    expect(result).toEqual(updatedGrievance);
  });
});