import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { SettingsModule } from '@rumsan/extensions/settings';
import { PrismaModule } from '@rumsan/prisma';
import { SseModule } from '@rahataid/sse';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    SettingsModule,
    SseModule,
    BullModule.registerQueue({ name: BQUEUE.RAHAT_IMPORT }),
    BullModule.registerQueue({ name: BQUEUE.RAHAT_BENEFICIARY }),
  ],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService, SseModule],
})
export class ImportsModule {}
