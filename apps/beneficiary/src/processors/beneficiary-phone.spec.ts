import { MailerService } from '@nestjs-modules/mailer';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { ProjectContants } from '@rahataid/sdk';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { BeneficiaryProcessor } from './beneficiary.processor';

describe('beneficiary phone validation', () => {
  let processor: BeneficiaryProcessor;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BeneficiaryProcessor,
        ...[HttpService, MailerService, PrismaService, ProjectContants.ELClient, EventEmitter2, SettingsService]
          .map((provide) => ({ provide, useValue: {} })),
      ],
    }).compile();
    processor = module.get(BeneficiaryProcessor);
  });

  it('accepts a valid Nepali number', async () => {
    await expect(processor.isValidNepaliNumber('+9779841234567'))
      .resolves.toEqual({ success: true, isValid: true });
  });

  it('rejects a valid number from a different region', async () => {
    await expect(processor.isValidNepaliNumber('+12025550123'))
      .resolves.toEqual({ success: true, isValid: false });
  });

  it('reports an invalid phone string', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    try {
      await expect(processor.isValidNepaliNumber('not-a-phone'))
        .resolves.toEqual({ success: false, isValid: false });
    } finally {
      error.mockRestore();
    }
  });
});
