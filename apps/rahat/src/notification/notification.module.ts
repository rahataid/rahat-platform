import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { PushProcessor } from '../processors/push.processor';
import { AudienceResolver } from './audience.resolver';
import { FirebaseService } from './firebase.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';
import { WebPushService } from './web-push.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseService, PushService, WebPushService, PushProcessor, AudienceResolver, SmsService],
  exports: [NotificationService, PushService],
})
export class NotificationModule { }