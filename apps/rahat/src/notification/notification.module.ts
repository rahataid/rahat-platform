import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { FirebaseService } from './firebase.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseService, PushService],
  exports: [NotificationService, PushService],
})
export class NotificationModule { }