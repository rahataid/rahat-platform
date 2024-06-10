import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { StatsService } from '@rahat/stats';
import { BQUEUE } from '@rahataid/sdk';
import { BeneficiaryStatService } from '../beneficiary/beneficiaryStat.service';
import { EmailService } from './email.service';
import { ListenersService } from './listener.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: BQUEUE.RAHAT_BENEFICIARY,
    }),
  ],
  providers: [ListenersService, StatsService, BeneficiaryStatService, EmailService],
})
export class ListenersModule { }
