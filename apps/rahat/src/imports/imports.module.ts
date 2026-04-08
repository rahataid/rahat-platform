import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BQUEUE } from '@rahataid/sdk';
import { SettingsModule } from '@rumsan/extensions/settings';
import { PrismaModule } from '@rumsan/prisma';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    SettingsModule,
    BullModule.registerQueue({ name: BQUEUE.RAHAT_IMPORT }),
  ],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
