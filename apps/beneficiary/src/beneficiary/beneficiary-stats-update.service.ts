import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BeneficiaryJobs, BQUEUE } from '@rahataid/sdk';
import { Queue } from 'bull';
import { STATS_RECOMPUTE_DELAY_MS, STATS_RECOMPUTE_JOB_ID } from './beneficiary.constants';
import { BeneficiaryStatService } from './beneficiaryStat.service';

@Injectable()
export class BeneficiaryStatsUpdateService {
    constructor(
        @InjectQueue(BQUEUE.RAHAT_BENEFICIARY)
        private readonly beneficiaryQueue: Queue,
        private readonly beneficiaryStatService: BeneficiaryStatService,
    ) { }

    async scheduleUpdate(projectUUID: string | null = null): Promise<void> {
        await this.beneficiaryQueue.add(
            BeneficiaryJobs.UPDATE_STATS,
            { projectUUID },
            {
                jobId: STATS_RECOMPUTE_JOB_ID,
                delay: STATS_RECOMPUTE_DELAY_MS,
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    async updateStats(projectUUID?: string | null) {
        return this.beneficiaryStatService.saveAllStats(projectUUID ?? undefined);
    }
}