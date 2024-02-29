import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StatsService } from '@rahat/stats';
import { BQUEUE } from '@rahataid/sdk';
import { Queue } from 'bull';
import { BeneficiaryStatService } from '../beneficiary/beneficiaryStat.service';
import { EVENTS } from '../constants';
@Injectable()
export class ListenersService {
  constructor(
    @InjectQueue(BQUEUE.RAHAT_BENEFICIARY) private readonly queue: Queue,
    private readonly benStats: BeneficiaryStatService,
    private readonly statsService: StatsService
  ) {}

  @OnEvent(EVENTS.BENEFICIARY_CREATED)
  @OnEvent(EVENTS.BENEFICIARY_UPDATED)
  @OnEvent(EVENTS.BENEFICIARY_REMOVED)
  async onBeneficiaryChanged() {
    await this.benStats.saveAllStats();
  }
}
