import { Test, TestingModule } from '@nestjs/testing';
import { GrievanceService } from './grievance.service';
import { PrismaService } from "@rumsan/prisma";
import { createGrievanceDTO, deletedGrievance, expectedGrievance, grievancesList, updatedGrievance, userId } from './testFixtureData2';
import { ChangeGrievanceStatusDTO } from '@rahataid/extensions';
import { GrievanceStatus } from '@rahataid/sdk';

describe('GrievanceService', () => {
  let service: GrievanceService;
  let prisma: PrismaService;
  let paginate: jest.Mock;

  beforeEach(async () => {
    paginate = jest.fn().mockResolvedValue({
      data: grievancesList,
      page: 1,
      perPage: 20,
      total: grievancesList.length,
    });

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
              delete: jest.fn()
            },
          },
        },
        {
          provide: 'paginate',
          useValue: paginate
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

  // it('should return list of paginated grievances as per query', async () => {
  //   const result = await service.findAll(grievanceQuery);
  //   console.log(result, 'result');
  //   expect(paginate).toHaveBeenCalledWith(
  //     prisma.grievance,
  //     {
  //       include: {
  //         project: { select: { name: true, uuid: true } },
  //         reporterUser: { select: { name: true, uuid: true, id: true } },
  //       },
  //       where: {
  //         deletedAt: null,
  //         projectId: {
  //           equals: grievanceQuery.projectId,
  //         },
  //       },
  //     },
  //     {
  //       page: grievanceQuery.page,
  //       perPage: grievanceQuery.perPage,
  //     },
  //   );
  //   expect(result).toEqual({
  //     data: grievancesList,
  //     page: 1,
  //     perPage: 20,
  //     total: grievancesList.length,
  //   });
  // });

  it('should retrieve a grievance with associated project and reporterUser', async () => {
    const uuid = process.env.GRIEVANCE_UUID;
    jest.spyOn(prisma.grievance, 'findUnique').mockResolvedValue(grievancesList[0]);
    const result = await service.getGrievance(uuid);
    expect(prisma.grievance.findUnique).toHaveBeenCalledWith({
      where: { uuid },
      include: {
        project: {
          select: { name: true, uuid: true },
        },
        reporterUser: {
          select: { name: true, uuid: true, id: true },
        },
      },
    });
    expect(result).toEqual(grievancesList[0]);
  });

  it('should update the grievance status using uuid', async () => {
    const uuid  = process.env.GRIEVANCE_UUID;
    const data = { status: 'NEW' } as ChangeGrievanceStatusDTO;
    jest.spyOn(prisma.grievance, 'update').mockResolvedValue(updatedGrievance);
    const result = await service.changeStatus(uuid, data);
    expect(prisma.grievance.update).toHaveBeenCalledWith({
      where: {uuid},
      data: {status: data.status}
    });
    expect(result).toEqual(updatedGrievance);
  });

  it('should soft delete the grievance using uuid', async () => {
    const uuid = 'test-uuid';
    jest.spyOn(prisma.grievance, 'update').mockResolvedValue(deletedGrievance);
    const result = await service.softDelete(uuid);
    expect(prisma.grievance.update).toHaveBeenCalledWith({
      where: { uuid },
      data: { deletedAt: expect.any(Date) },
    });
    expect(result).toEqual(deletedGrievance);
  });
});