import { Module } from '@nestjs/common';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryController } from './beneficiary.controller';
import { PrismaModule } from '@rumsan/prisma';
import { BullModule } from '@nestjs/bull';
import { BQUEUE } from '@rahat/sdk';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
  ],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService],
})
export class BeneficiaryModule {}
