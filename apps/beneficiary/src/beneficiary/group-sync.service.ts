import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { BeneficiaryJobs, BQUEUE } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';

@Injectable()
export class GroupSyncService {
  private readonly logger = new Logger(GroupSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(BQUEUE.RAHAT_BENEFICIARY) private readonly beneficiaryQueue: Queue,
  ) {}

  async syncGroup(groupUuid: string): Promise<{ queued: number }> {
    const projects = await this.prisma.beneficiaryGroupProject.findMany({
      where: { beneficiaryGroupId: groupUuid, deletedAt: null },
      select: { projectId: true },
    });

    if (!projects.length) {
      this.logger.log(`Group ${groupUuid} is not assigned to any project, skipping sync`);
      return { queued: 0 };
    }

    for (const { projectId } of projects) {
      await this.beneficiaryQueue.add(
        BeneficiaryJobs.SYNC_GROUP_BENEFICIARIES_TO_PROJECT,
        { groupUuid, projectId },
        { attempts: 3, removeOnComplete: true, backoff: { type: 'exponential', delay: 2000 } },
      );
      this.logger.log(`Queued SYNC_GROUP_TO_PROJECTS for group ${groupUuid} → project ${projectId}`);
    }

    return { queued: projects.length };
  }
}
