import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BQUEUE } from '@rahat/sdk';
import { StatsService } from '@rahat/stats';
import { BeneficiaryStatService } from '../beneficiary/beneficiaryStat.service';
import { ListenersService } from './listener.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BQUEUE.RAHAT_BENEFICIARY,
    }),
  ],
  providers: [ListenersService, StatsService, BeneficiaryStatService],
})
export class ListenersModule {}
