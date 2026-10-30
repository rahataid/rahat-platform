import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { BeneficiaryJobs, BQUEUE } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { ProjectStatus } from '@prisma/client';
import { Queue } from 'bull';

@Injectable()
export class GroupSyncService {
  private readonly logger = new Logger(GroupSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(BQUEUE.RAHAT_BENEFICIARY) private readonly beneficiaryQueue: Queue,
  ) {}

  async syncGroup(groupUuid: string): Promise<{ queued: number; skippedPending: number }> {
    const assignments = await this.prisma.beneficiaryGroupProject.findMany({
      where: {
        beneficiaryGroupId: groupUuid,
        deletedAt: null,
        Project: { status: { not: ProjectStatus.CLOSED } },
      },
      select: { projectId: true, syncStatus: true },
    });

    // A PENDING group may not exist on the project side yet (or may be rolled back),
    // and its import already sends fresh data, so only synced assignments are re-synced.
    const projects = assignments.filter((a) => a.syncStatus === 'SYNCED');
    const skippedPending = assignments.length - projects.length;
    if (skippedPending) {
      this.logger.log(`Group ${groupUuid}: skipped ${skippedPending} project(s) still importing`);
    }

    if (!projects.length) {
      this.logger.log(`Group ${groupUuid} has no synced project assignment, skipping sync`);
      return { queued: 0, skippedPending };
    }

    for (const { projectId } of projects) {
      await this.beneficiaryQueue.add(
        BeneficiaryJobs.SYNC_GROUP_BENEFICIARIES_TO_PROJECT,
        { groupUuid, projectId },
        { attempts: 1, removeOnComplete: true },
      );
      this.logger.log(`Queued SYNC_GROUP_TO_PROJECTS for group ${groupUuid} → project ${projectId}`);
    }

    return { queued: projects.length, skippedPending };
  }
}
