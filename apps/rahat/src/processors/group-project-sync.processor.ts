import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BQUEUE } from '@rahataid/sdk';
import { BeneficiaryJobs } from '@rahataid/sdk/beneficiary';
import { PrismaService } from '@rumsan/prisma';
import { Job } from 'bull';
import { firstValueFrom } from 'rxjs';

const SYNC_BATCH_SIZE = 50;

@Processor(BQUEUE.RAHAT_BENEFICIARY)
export class GroupProjectSyncProcessor {
  private readonly logger = new Logger(GroupProjectSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RAHAT_CLIENT') private readonly client: ClientProxy,
  ) { }

  @Process({ name: BeneficiaryJobs.SYNC_GROUP_TO_PROJECTS, concurrency: 2 })
  async syncGroupToProject(job: Job<{ groupUuid: string; projectId: string }>) {
    const { groupUuid, projectId } = job.data;
    this.logger.log(`Syncing group ${groupUuid} → project ${projectId}`);

    // Fetch all beneficiaries in the group with full data needed for AA microservice
    const grouped = await this.prisma.groupedBeneficiaries.findMany({
      where: { beneficiaryGroupId: groupUuid, deletedAt: null },
      select: {
        Beneficiary: {
          select: {
            uuid: true,
            walletAddress: true,
            gender: true,
            extras: true,
            isVerified: true,
            pii: {
              select: { phone: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!grouped.length) {
      this.logger.log(`No beneficiaries in group ${groupUuid}, skipping`);
      return;
    }

    const total = grouped.length;
    let processed = 0;

    for (let i = 0; i < total; i += SYNC_BATCH_SIZE) {
      const batch = grouped.slice(i, i + SYNC_BATCH_SIZE);

      const beneficiariesData = batch.map(({ Beneficiary: b }) => ({
        uuid: b.uuid,
        walletAddress: b.walletAddress,
        gender: b.gender,
        isVerified: b.isVerified,
        extras: {
          ...((b.extras as object) || {}),
          phone: b.pii?.phone || null,
        },
        phone: b.pii?.phone || null,
      }));

      await firstValueFrom(
        this.client.send(
          { cmd: BeneficiaryJobs.SYNC_IMPORTED_GROUP_BENEFICIARIES, uuid: projectId },
          { beneficiariesData },
        ),
      );

      processed += batch.length;
      await job.progress({ processed, total });
      this.logger.log(`group ${groupUuid} → project ${projectId}: ${processed}/${total} sent`);
    }

    this.logger.log(`Sync complete: group ${groupUuid} → project ${projectId} (${total} beneficiaries)`);
  }
}
