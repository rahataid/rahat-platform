import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule { }