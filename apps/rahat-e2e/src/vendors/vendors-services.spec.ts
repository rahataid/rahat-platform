import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from "@rumsan/prisma";
import {VendorsService} from "../../../rahat/src/vendors/vendors.service";


describe('VendorsService', () => {
  let service: VendorsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        {
          provide: PrismaService,
          useValue: {
            vendors: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn()
            },
          },
        },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

    it('should return the count of vendors', async () => {
        const prisma = {
            userRole: {
                count: jest.fn()
            }
        };
        prisma.userRole.count.mockResolvedValue(6);
        const result = await service.getVendorCount();
        console.log(result, 'result in vendor stats');
    });
});