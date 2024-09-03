import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { BQUEUE, BeneficiaryJobs } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Job } from 'bull';
import { UUID } from 'crypto';
import { splitBeneficiaryPII } from '../beneficiary/helpers';
import { findTempBenefGroups, validateDupicatePhone, validateDupicateWallet } from './processor.utils';

const BATCH_SIZE = 20;

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
    try {
      const { groupUUID } = job.data;
      const tempGroup = await this.prisma.tempGroup.findUnique({
        where: { uuid: groupUUID }
      });
      const groups = await findTempBenefGroups(this.prisma, groupUUID);
      if (!groups.length) return;
      const beneficiaries = groups.map((f) => f.tempBeneficiary);
      if (!beneficiaries.length) return;

      // Validate duplicate phones and wallets
      const dupliPhones = await validateDupicatePhone(this.prisma, beneficiaries);
      if (dupliPhones.length) throw new Error(`Duplicate phones found: ${dupliPhones.toString()}`);
      const dupliWallets = await validateDupicateWallet(this.prisma, beneficiaries);
      if (dupliWallets.length) throw new Error(`Duplicate walletAddress found: ${dupliWallets.toString()}`);

      // =====Txn start====
      for (let i = 0; i < beneficiaries.length; i += BATCH_SIZE) {
        console.log("Batch=>", i);
        const batch = beneficiaries.slice(i, i + BATCH_SIZE);
        await this.prisma.$transaction(async (txn) => {
          await importAndAddToGroup({ txn, beneficiaries: batch, tempGroup });
        }, {
          maxWait: 5000,
          timeout: 25000
        })
      }
      // ====Txn start end===
      await removeTempGroup(this.prisma, tempGroup.uuid);

    } catch (err) {
      console.log("Import Error=>", err.message);
      throw err;
    }
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
async function importAndAddToGroup({ txn, beneficiaries, tempGroup }) {
  const { name, uuid: tempGUID } = tempGroup;
  const group = await upsertGroup(txn, name);
  for (let benef of beneficiaries) {
    const { uuid, ...rest } = benef;
    const { piiData, nonPii } = splitBeneficiaryPII(rest);
    const newBenef = await upsertBeneficiary(txn, nonPii);
    const piiDataPayload = { ...piiData, beneficiaryId: newBenef.id };
    await upsertPiiData(txn, piiDataPayload);
    await addBenefToGroup(txn, group.uuid, newBenef.uuid);
    const removed = await removeFromTempBenefGroup(txn, uuid, tempGUID);
    await removeTempBeneficiary(txn, removed.tempBenefUID);
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
  return txn.beneficiaryPii.upsert({
    where: { phone: data.phone },
    update: data,
    create: data
  });
}

async function addBenefToGroup(txn: any, groupUID: UUID, benefUID: UUID) {
  const payload = {
    beneficiaryGroupId: groupUID,
    beneficiaryId: benefUID
  }
  return txn.groupedBeneficiaries.upsert({
    where: {
      beneficiaryGroupIdentifier: payload
    },
    update: payload,
    create: payload
  })
};

async function removeTempBeneficiary(txn: any, uuid: UUID) {
  const rows = await txn.tempBeneficiaryGroup.findMany({ where: { tempBenefUID: uuid } });
  if (rows.length) return;
  return txn.tempBeneficiary.delete({ where: { uuid } })
}

async function upsertGroup(txn: any, name: string) {
  return txn.beneficiaryGroup.upsert({
    where: { name },
    update: { name },
    create: { name }
  })
}

async function removeFromTempBenefGroup(txn: any, benefUID: UUID, groupUUID: UUID) {
  return txn.tempBeneficiaryGroup.delete({
    where: {
      tempBeneficiaryGroupIdentifier: {
        tempBenefUID: benefUID,
        tempGroupUID: groupUUID
      }
    }
  })
}

async function removeTempGroup(prisma: any, tempGroupUID: string) {
  return prisma.tempGroup.delete({ where: { uuid: tempGroupUID } })
}

//=========== // End Import helper txns=====================


