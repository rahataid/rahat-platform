import { Test, TestingModule } from '@nestjs/testing';
import { GrievanceService } from './grievance.service';
import { PrismaService, paginator } from "@rumsan/prisma";
import { createGrievanceDTO, deletedGrievance, expectedGrievance, grievanceQuery, grievancesList, updatedGrievance, userId } from './testFixtureData2';
import { ChangeGrievanceStatusDTO, ListGrievanceDTO } from '@rahataid/extensions';
import { GrievanceStatus } from '@rahataid/sdk';

// const mockPaginator = jest.fn();
// jest.mock('@rumsan/prisma', () => ({
//   paginator: jest.fn(() => mockPaginator)
// }));

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
              delete: jest.fn(),
              findMany: jest.fn()
            },
          },
        },
      ],
    }).compile();

    service = module.get<GrievanceService>(GrievanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // it('should return list of paginated grievances as per query', async () => {
  //   const grievanceQuery: ListGrievanceDTO = {
  //     sort: 'createAt',
  //     order: 'asc',
  //     page: 1,
  //     perPage: 20,
  //     projectId: process.env.PROJECT_ID
  //   };
  //   mockPaginator.mockResolvedValueOnce({
  //     data: [
  //       {
  //         id: 1,
  //         title: "title",
  //         description: "description",
  //         status: GrievanceStatus.NEW,
  //         projectId: 1,
  //         reporterUserId: 1
  //       }
  //     ],
  //     page: 1,
  //     perPage: 20,
  //     total: 1
  //   });
  //   const result = await service.findAll(grievanceQuery);
  //   expect(result).toEqual({
  //     data: [
  //       {
  //         id: 1,
  //         title: "title",
  //         description: "description",
  //         status: GrievanceStatus.NEW,
  //         projectId: 1,
  //         reporterUserId: 1
  //       }
  //     ],
  //     page: 1,
  //     perPage: 20,
  //     total: 1
  //   });
  // });

  describe("create new grievance", () => {
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
  });

  describe("get specific grievance", () => {
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
  });

  describe('update grievance fields', () => {
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
  });

  describe("soft delete grievance", () => {
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
});