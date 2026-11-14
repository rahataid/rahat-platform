import { BeneficiaryUtilsService } from './beneficiary.utils.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@rumsan/prisma';
import { SettingsService } from '@rumsan/extensions/settings';
import { ProjectContants } from '@rahataid/sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateBeneficiaryDto } from '@rahataid/extensions';

describe('beneficiary phone validation in the microservice', () => {
  let service: BeneficiaryUtilsService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BeneficiaryUtilsService,
        { provide: PrismaService, useValue: {} },
        { provide: SettingsService, useValue: {} },
        { provide: ProjectContants.ELClient, useValue: {} },
        { provide: 'RAHAT_CLIENT', useValue: {} },
        { provide: EventEmitter2, useValue: {} },
      ],
    }).compile();
    service = module.get(BeneficiaryUtilsService);
  });

  it('accepts valid international phones', async () => {
    await expect(service.ensurePhoneNumbers([
      { piiData: { phone: '+9779812345678' } } as CreateBeneficiaryDto,
    ])).resolves.toBeUndefined();
  });

  it('rejects missing and malformed phones before any database operation', async () => {
    await expect(service.ensurePhoneNumbers([{} as CreateBeneficiaryDto])).rejects.toThrow('Phone number is required');
    await expect(service.ensurePhoneNumbers([
      { piiData: { phone: '9812345678' } } as CreateBeneficiaryDto,
    ])).rejects.toThrow('E.164 format');
  });
});
