import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from "@rumsan/prisma";
import { VendorsService } from "./vendors.service";
import { UserRoles } from '@rahataid/sdk';
import { AuthsService } from '@rumsan/user';
import { UsersService } from '../users/users.service';
import { NotificationService } from '../notification/notification.service';
import { v4 as uuidv4 } from 'uuid';
import { VendorRegisterDto } from '@rahataid/extensions';
import { Service } from '@rumsan/sdk/enums';

jest.mock('@rahataid/sdk', () => ({
  ...jest.requireActual('@rahataid/sdk'),
  UserRoles: {
    VENDOR: 'VENDOR',
    ADMIN: 'ADMIN',
    USER: 'USER',
  },
}));

jest.mock('../utils/web3', () => ({
  isAddress: jest.fn()
}));

import { isAddress } from '../utils/web3';

describe('VendorsService', () => {
  let service: VendorsService;
  let prisma: PrismaService;
  let authService: AuthsService;
  let userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn) => fn(prisma)),
            role: {
              findFirst: jest.fn(),
            },
            userRole: {
              findFirst: jest.fn(),
              create: jest.fn(),
              count: jest.fn(),
            },
            vendors: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn()
            },
            auth: {
              create: jest.fn()
            },
            projectVendors: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: AuthsService,
          useValue: {
            getOtp: jest.fn(),
            create: jest.fn()
          }
        },
        {
          provide: UsersService,
          useValue: {
              update: jest.fn()
          },
        },
        {
          provide: NotificationService,
          useValue: { send: jest.fn(), sendBulk: jest.fn(), createNotification: jest.fn() },
        },
        {
          provide: 'EL_PROJECT_CLIENT',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthsService>(AuthsService);
    userService = module.get<UsersService>(UsersService);
  });

  describe('register vendor', () => {
    const requestMock = {
      service: "EMAIL",
      name: "John Doe",
      email: "john@mailinator.com",
      phone: "9834123456",
      wallet: "0x000000000000000000000",
      extras: {
        isVendor: true
      }
    };
    const role = { id: 1, name: UserRoles.VENDOR };
    const user = { id: 1, email: requestMock.email };

    it('should throw error if role is not found', async () => {
      (prisma.role.findFirst as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.registerVendor(requestMock as VendorRegisterDto)).rejects.toThrow('Role not found');
    });

    it('should throw error if email already exists', async () => {
      const existingUser = { id: 1, email: requestMock.email };
      (prisma.role.findFirst as jest.Mock).mockResolvedValueOnce(role);
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(existingUser);
      await expect(service.registerVendor(requestMock as VendorRegisterDto)).rejects.toThrow('Email must be unique');
      expect(prisma.user.findFirst).toHaveBeenCalledWith({where: {
        OR: [{ email: requestMock.email }, { phone: requestMock.phone }]
      }});
    });

    it('should create new vendor, assign a role and create auth entries', async () => {
      (prisma.role.findFirst as jest.Mock).mockResolvedValue(role);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(user);
      (prisma.userRole.create as jest.Mock).mockResolvedValue({userId: 1, roleId: 1});
      (prisma.auth.create as jest.Mock).mockResolvedValueOnce({ userId: user.id, service: Service.WALLET, serviceId: requestMock.wallet });
      await service.registerVendor(requestMock as VendorRegisterDto);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: requestMock.email,
          name: requestMock.name,
        })
      });
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: user.id, roleId: role.id }
      });
    });
  });

  describe('get vendor count', () => {
    it('should return the count of vendors', async () => {
      const mockCount = 6;
      (prisma.userRole.count as jest.Mock).mockResolvedValue(mockCount);
      const result = await service.getVendorCount();
      expect(prisma.userRole.count).toHaveBeenCalledWith({
        where: {
          Role: {
            name: UserRoles.VENDOR,
          },
        },
      });
      expect(result).toBe(mockCount);
    });
  });

  describe('get specific vendor details', () => {
    it('should return project data when id is a UUID', async () => {
      const id = uuidv4();
      const userMock = { uuid: id, name: 'Vendor1' };
      const projectMocks = [
        { Project: { id: 1, name: 'Project1' }, User: userMock },
        { Project: { id: 2, name: 'Project2' }, User: userMock },
      ];
      (isAddress as unknown as jest.Mock).mockReturnValue(false);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userMock);
      (prisma.projectVendors.findMany as jest.Mock).mockResolvedValue(projectMocks);
      const result = await service.getVendor(id as any);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { uuid: id } });
      expect(result).toEqual(projectMocks);
    });

    it('should return project data when id is an Address', async () => {
      const id = '0x1234567890abcdef';
      const userMock = { uuid: uuidv4(), wallet: id, name: 'Vendor2' };
      const projectMocks = [
        { Project: { id: 1, name: 'Project1' }, User: userMock },
      ];
      (isAddress as unknown as jest.Mock).mockReturnValue(true);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(userMock);
      (prisma.projectVendors.findMany as jest.Mock).mockResolvedValue(projectMocks);
      const result = await service.getVendor(id as any);
      expect(isAddress).toHaveBeenCalledWith(id);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { wallet: id } });
      expect(result).toEqual(projectMocks);
    });

    it('should throw error if vendor is not found', async () => {
      const id = uuidv4();
      (isAddress as unknown as jest.Mock).mockReturnValue(false);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getVendor(id as any)).rejects.toThrow(`Vendor not found with id: ${id}`);
    });
  });

  describe('should update the details of vendor', () => {
    const uuid = 'uuid';
    const dto = {
      email: 'abc@gmail.com',
      extras: { key2: 'value2' }
    }
    const responseMock = {
      id: 1,
      uuid: uuid,
      name: "name",
      gender: "UNKNOWN",
      email: dto.email,
      phone: "number",
      wallet: "0x00",
      extras: {
        key1: 'value1',
        key2: 'value2'
      },
      createdAt: "2024-08-28T04:34:18.786Z",
      updatedAt: "2024-08-28T11:24:12.464Z",
      deletedAt: null,
      createdBy: null,
      updatedBy: null
  };
    it('should throw error if email already exists while updating the details of vendor', async() => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(dto);
      await expect(service.updateVendor(dto, uuid)).rejects.toThrow("Email must be unique");
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: dto.email,
          NOT: { uuid }
        }
      });
    });

    it('should update extras with existing vendors extras if dto consists extras', async() => {
      const existingExtras = { extras: { key1: 'value1' } };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({uuid, ...existingExtras});
      dto.extras = { ...dto.extras, ...existingExtras.extras };
      const updatedDto = dto;
      (userService.update as jest.Mock).mockResolvedValue(responseMock);
      (prisma.projectVendors.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await service.updateVendor(dto, uuid);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { uuid } });
      expect(userService.update).toHaveBeenCalledWith(uuid, updatedDto);
      expect(result).toEqual(responseMock);
    });

    it('should update the vendor details field', async () => {
      const dto = { email: 'xyz@gmail.com' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (userService.update as jest.Mock).mockResolvedValue(responseMock);
      (prisma.projectVendors.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await service.updateVendor(dto, uuid);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: dto.email,
          NOT: { uuid }
        }
      });
      expect(userService.update).toHaveBeenCalledWith(uuid, dto);
      expect(result).toEqual(responseMock);
    });
  });
});
