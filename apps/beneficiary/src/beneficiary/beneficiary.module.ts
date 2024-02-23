import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BQUEUE } from '@rahat/sdk';
import { StatsModule } from '@rahat/stats';
import { PrismaModule } from '@rumsan/prisma';
import { BeneficiaryController } from './beneficiary.controller';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryStatService } from './beneficiaryStat.service';

@Module({
  imports: [
    PrismaModule,
    StatsModule,
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
  ],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService, BeneficiaryStatService],
})
export class BeneficiaryModule {}
