// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { HttpService } from '@nestjs/axios';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { BeneficiaryJobs, BQUEUE } from '@rahataid/sdk';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { Job } from 'bull';
import { getBankId } from '../utils/banks';

@Processor(BQUEUE.RAHAT_BENEFICIARY_BANK_CHECK)
export class BankAccountCheckProcessor {
  private readonly logger = new Logger(BankAccountCheckProcessor.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  @Process({
    name: BeneficiaryJobs.CHECK_BENEFICIARY_BANK_ACCOUNT,
    concurrency: 1,
  })
  async checkBeneficiaryAccount(
    job: Job<{
      uuid: string;
      walletAddress: string;
      extras: {
        bank_name: string;
        bank_ac_name: string;
        bank_ac_number: string;
      };
    }>
  ) {
    this.logger.log(
      `Checking beneficiary bank account for benf: ${job.data.uuid}`
    );

    const { uuid, extras } = job.data;

    try {
      const benf = await this.prisma.beneficiary.findUnique({
        where: { uuid },
      });

      if (!benf) {
        this.logger.error(`Beneficiary not found for benf: ${uuid}`);
        return;
      }

      if (!extras) {
        this.logger.error(
          `Beneficiary does not have bank account for benf: ${uuid}`
        );
        await this.updateBenfExtras(uuid, {
          ...JSON.parse(JSON.stringify(benf.extras)),
          bankedStatus: 'ERROR',
          error: 'Beneficiary does not have bank account',
        });

        return;
      }

      const { bank_name, bank_ac_name, bank_ac_number } = extras;
      const benfExtras = JSON.parse(JSON.stringify(benf.extras));

      if (!bank_name || !bank_ac_name || !bank_ac_number) {
        this.logger.error(
          `Beneficiary does not have bank account for benf: ${uuid}`
        );

        await this.updateBenfExtras(uuid, {
          ...benfExtras,
          bankedStatus: 'ERROR',
          error: 'Beneficiary does not have bank account',
        });

        return;
      }

      const bankId = getBankId(bank_name);
      if (!bankId) {
        this.logger.error(`Invalid bank name for benf: ${uuid}`);

        await this.updateBenfExtras(uuid, {
          ...benfExtras,
          bankedStatus: 'ERROR',
          error: 'Invalid bank name',
        });
        return;
      }

      const bankAccount = await this.checkBankAccount(
        bankId,
        bank_ac_number,
        bank_ac_name
      );
      if (!bankAccount.isValid) {
        this.logger.error(`Invalid bank account for benf: ${uuid}`);
        await this.updateBenfExtras(uuid, {
          ...benfExtras,
          bankedStatus: 'ERROR',
          error: bankAccount?.message || 'Invalid bank account',
          validBankAccount: false,
        });
        return;
      }

      if (!bankAccount.success) {
        this.logger.error(`Error checking bank account for benf: ${uuid}`);
        await this.updateBenfExtras(uuid, {
          ...benfExtras,
          bankedStatus: 'ERROR',
          error: 'Error checking bank account',
          validBankAccount: false,
        });
        return;
      }

      this.logger.log(`Bank account is valid for benf: ${uuid}`);

      delete benfExtras.error;

      await this.updateBenfExtras(uuid, {
        ...benfExtras,
        validBankAccount: true,
        bankedStatus: 'BANKED',
      });

      return;
    } catch (error) {
      this.logger.error('Error checking bank account', error);
      return;
    }
  }

  async checkBankAccount(
    bankId: string,
    bank_ac_number: string,
    bank_ac_name: string
  ) {
    try {
      const res = await this.settingsService.getPublic('OFFRAMP_SETTINGS');

      if (!res) {
        throw new Error(`Offramp not found in settings.`);
      }

      const baseUrl = (res?.value as any)?.URL as string;
      const appId = (res?.value as any)?.APPID as string;

      if (!baseUrl) {
        throw new Error(`Offramp URL not found in settings.`);
      }

      if (!appId) {
        throw new Error(`Offramp APP_ID not found in settings.`);
      }

      const payload = {
        provider: 'cips',
        method: 'validateAccount',
        params: {
          bankId: bankId,
          accountName: bank_ac_name,
          accountId: bank_ac_number,
        },
      };
      const {
        data: { data },
      } = await this.httpService.axiosRef.post<{
        data: {
          isValid: boolean;
        }
      }>(
        `${baseUrl}/payment-provider/json-rpc`,
        payload,
        {
          headers: {
            'APP_ID': appId,
          },
        }
      );

      return {
        success: true,
        isValid: data.isValid,
      };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message;
      this.logger.error(`Error checking bank account: '${errorMessage}'`);

      return {
        success: false,
        isValid: false,
        message: `Invalid bank account: '${errorMessage}'`,
      };
    }
  }

  async updateBenfExtras(uuid: string, extras: any) {
    return await this.prisma.beneficiary.update({
      where: { uuid },
      data: {
        bankedStatus: extras.bankedStatus === 'BANKED' ? 'BANKED' : 'UNBANKED',
        extras: {
          ...JSON.parse(JSON.stringify(extras)),
        },
      },
    });
  }
}
