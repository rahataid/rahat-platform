import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { BQUEUE, BeneficiaryJobs } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Job } from 'bull';
import { UUID } from 'crypto';
import { splitBeneficiaryPII } from '../beneficiary/helpers';

@Processor(BQUEUE.RAHAT_BENEFICIARY)
export class BeneficiaryProcessor {
  private readonly logger = new Logger(BeneficiaryProcessor.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService
  ) { }

  @Process(BeneficiaryJobs.UPDATE_STATS)
  async sample(job: Job<any>) {
    console.log('sample', job.data);
  }

  @Process(BeneficiaryJobs.IMPORT_TEMP_BENEFICIARIES)
  async importTempBeneficiary(job: Job<any>) {
    const { groupName, beneficiaries } = job.data;
    if (!beneficiaries.length) return;
    return this.prisma.$transaction(async (txn) => {
      const group = await upsertGroup(txn, groupName);
      await upsertBeneficiaryAndPII(txn, beneficiaries, group.uuid);
    })
  }

  @Process(BeneficiaryJobs.GENERATE_LINK)
  async generateLink(job: Job<any>) {
    console.log(job.data);
    if (job.data) {
      await this.mailerService.sendMail({
        to: job.data.email,
        from: 'raghav.kattel@rumsan.net',
        subject: 'Wallet Verification Link',
        template: './wallet-verification',
        context: { encryptedData: job.data.encrypted, name: job.data.name },
      });
      console.log('Email sent to', job.data.email);
      return true;
    }

    throw new BadRequestException();
  }
}

//===========Import helper txns=====================
async function upsertGroup(txn: any, name: string) {
  return txn.beneficiaryGroup.upsert({
    where: { name },
    update: { name },
    create: { name }
  })
}

async function upsertBeneficiaryAndPII(txn: any, beneficiaries: [], groupUID: UUID) {
  for (let b of beneficiaries) {
    const benef = await txn.tempBeneficiary.findUnique({
      where: {
        uuid: b
      }
    })
    if (benef) {
      const { uuid, ...rest } = benef;
      const { piiData, nonPii } = splitBeneficiaryPII(rest);
      const newBenef = await upsertBeneficiary(txn, nonPii);
      const piiDataPayload = { ...piiData, beneficiaryId: newBenef.id };
      await upsertPiiData(txn, piiDataPayload);
      await addBenefToGroup(txn, groupUID, newBenef.uuid);
      await removeTempBeneficiary(txn, uuid)
    }
  }
}

async function upsertBeneficiary(txn: any, data: any) {
  return txn.beneficiary.upsert({
    where: { walletAddress: data.walletAddress },
    update: data,
    create: data
  });
}

async function upsertPiiData(txn: any, data: any) {
  await txn.beneficiaryPii.upsert({
    where: { beneficiaryId: data.beneficiaryId },
    update: data,
    create: data
  });
}

async function addBenefToGroup(txn: any, groupUID: UUID, benefUID: UUID) {
  const payload = {
    beneficiaryGroupId: groupUID,
    beneficiaryId: benefUID
  }
  await txn.groupedBeneficiaries.upsert({
    where: {
      beneficiaryGroupIdentifier: payload
    },
    update: payload,
    create: payload
  })
};

async function removeTempBeneficiary(txn: any, uuid: UUID) {
  await txn.tempBeneficiary.delete({ where: { uuid } })
}
//=========== // End Import helper txns=====================


