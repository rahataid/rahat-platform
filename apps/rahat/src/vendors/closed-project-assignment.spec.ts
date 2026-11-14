import { Test } from '@nestjs/testing';
import { ProjectContants, UserRoles } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { AuthsService } from '@rumsan/user';
import { of } from 'rxjs';
import { NotificationService } from '../notification/notification.service';
import { UsersService } from '../users/users.service';
import { VendorsService } from './vendors.service';

describe('vendor project assignment', () => {
  const projectId = 'project-id';
  const vendorId = 'vendor-id';
  let service: VendorsService;
  let prisma: {
    project: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    userRole: { findMany: jest.Mock };
    projectVendors: { findUnique: jest.Mock; create: jest.Mock };
  };
  let client: { send: jest.Mock };

  beforeEach(async () => {
    prisma = {
      project: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      userRole: { findMany: jest.fn() },
      projectVendors: { findUnique: jest.fn(), create: jest.fn() },
    };
    client = { send: jest.fn().mockReturnValue(of({ id: 1 })) };
    const module = await Test.createTestingModule({
      providers: [
        VendorsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthsService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: ProjectContants.ELClient, useValue: client },
      ],
    }).compile();
    service = module.get(VendorsService);
  });

  it('rejects closed projects before looking up or syncing the vendor', async () => {
    prisma.project.findUnique.mockResolvedValue({ status: 'CLOSED' });
    await expect(service.assignToProject({ projectId, vendorId })).rejects.toThrow(
      'This project is closed. Beneficiary group and vendor assignment is not allowed.'
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(client.send).not.toHaveBeenCalled();
    expect(prisma.projectVendors.create).not.toHaveBeenCalled();
  });

  it('rejects a missing project', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.assignToProject({ projectId, vendorId })).rejects.toThrow('Project not found.');
    expect(client.send).not.toHaveBeenCalled();
  });

  it('continues assigning a vendor to an active project', async () => {
    prisma.project.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    prisma.user.findUnique.mockResolvedValue({ id: 1, uuid: vendorId, wallet: 'wallet' });
    prisma.userRole.findMany.mockResolvedValue([{ Role: { name: UserRoles.VENDOR } }]);
    prisma.projectVendors.findUnique.mockResolvedValue(null);
    prisma.projectVendors.create.mockResolvedValue({ id: 1 });
    await expect(service.assignToProject({ projectId, vendorId })).resolves.toEqual({ id: 1 });
    expect(prisma.projectVendors.create).toHaveBeenCalledTimes(1);
    expect(client.send).toHaveBeenCalledTimes(2);
  });
});
