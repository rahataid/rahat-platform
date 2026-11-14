import { getQueueToken } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { of } from 'rxjs';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryUtilsService } from './beneficiary.utils.service';
import { VerificationService } from './verification.service';

describe('beneficiary group project assignment', () => {
  const dto = { projectId: 'project-id', beneficiaryGroupId: 'group-id' };
  let service: BeneficiaryService;
  let prisma: {
    project: { findUnique: jest.Mock };
    beneficiaryGroup: { findUnique: jest.Mock };
    beneficiary: { findMany: jest.Mock };
    beneficiaryGroupProject: { create: jest.Mock };
    rsclient: object;
  };
  let client: { send: jest.Mock };

  beforeEach(async () => {
    prisma = {
      project: { findUnique: jest.fn() },
      beneficiaryGroup: { findUnique: jest.fn() },
      beneficiary: { findMany: jest.fn() },
      beneficiaryGroupProject: { create: jest.fn() },
      rsclient: {},
    };
    client = { send: jest.fn().mockReturnValue(of({ success: true })) };
    const module = await Test.createTestingModule({
      providers: [
        BeneficiaryService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectContants.ELClient, useValue: client },
        { provide: getQueueToken(BQUEUE.RAHAT_BENEFICIARY), useValue: {} },
        { provide: 'RAHAT_CLIENT', useValue: {} },
        { provide: EventEmitter2, useValue: {} },
        { provide: VerificationService, useValue: {} },
        { provide: BeneficiaryUtilsService, useValue: { getChainName: jest.fn().mockResolvedValue('evm') } },
      ],
    }).compile();
    service = module.get(BeneficiaryService);
  });

  it('rejects closed projects before reading or syncing the group', async () => {
    prisma.project.findUnique.mockResolvedValue({ status: 'CLOSED' });
    await expect(service.assignBeneficiaryGroupToProject(dto)).rejects.toThrow(
      'This project is closed. Beneficiary group and vendor assignment is not allowed.'
    );
    expect(prisma.beneficiaryGroup.findUnique).not.toHaveBeenCalled();
    expect(prisma.beneficiaryGroupProject.create).not.toHaveBeenCalled();
    expect(client.send).not.toHaveBeenCalled();
  });

  it('rejects a missing project', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.assignBeneficiaryGroupToProject(dto)).rejects.toThrow('Project not found.');
    expect(client.send).not.toHaveBeenCalled();
  });

  it('continues assigning a group to an active project', async () => {
    prisma.project.findUnique.mockResolvedValue({ uuid: dto.projectId, type: 'cva', status: 'ACTIVE' });
    prisma.beneficiaryGroup.findUnique.mockResolvedValue({ groupedBeneficiaries: [] });
    prisma.beneficiary.findMany.mockResolvedValue([]);
    prisma.beneficiaryGroupProject.create.mockResolvedValue({ id: 1 });
    const result = await service.assignBeneficiaryGroupToProject(dto);
    await expect(result.toPromise()).resolves.toEqual({ success: true });
    expect(prisma.beneficiaryGroupProject.create).toHaveBeenCalledTimes(1);
    expect(client.send).toHaveBeenCalledTimes(1);
  });
});
