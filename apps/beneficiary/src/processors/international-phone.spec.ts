import { HttpService } from '@nestjs/axios';
import { MailerService } from '@nestjs-modules/mailer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { ProjectContants } from '@rahataid/sdk';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { BeneficiaryProcessor } from './beneficiary.processor';

describe('beneficiary phone validation worker', () => {
  it('validates international numbers rather than restricting them to Nepal', async () => {
    const module = await Test.createTestingModule({
      providers: [
        BeneficiaryProcessor,
        { provide: HttpService, useValue: {} },
        { provide: MailerService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: ProjectContants.ELClient, useValue: {} },
        { provide: EventEmitter2, useValue: {} },
        { provide: SettingsService, useValue: {} },
      ],
    }).compile();
    const processor = module.get(BeneficiaryProcessor);
    await expect(processor.isValidPhoneNumber('+254712345678')).resolves.toEqual({ success: true, isValid: true });
    await expect(processor.isValidPhoneNumber('+254123')).resolves.toEqual({ success: true, isValid: false });
  });
});
