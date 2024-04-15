import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StatsService } from '@rahat/stats';
import { BeneficiaryEvents, BQUEUE } from '@rahataid/sdk';
import { Queue } from 'bull';
import { BeneficiaryStatService } from '../beneficiary/beneficiaryStat.service';
@Injectable()
export class ListenersService {
  constructor(
    @InjectQueue(BQUEUE.RAHAT_BENEFICIARY) private readonly queue: Queue,
    private readonly benStats: BeneficiaryStatService,
    private readonly statsService: StatsService
  ) { }

  @OnEvent(BeneficiaryEvents.BENEFICIARY_CREATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_UPDATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_REMOVED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_ASSIGNED_TO_PROJECT)
  async onBeneficiaryChanged(eventObject) {
    await this.benStats.saveAllStats(eventObject.projectUuid);
  }
}
