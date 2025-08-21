import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: BQUEUE.RAHAT,
        }),
    ],
    controllers: [NotificationController],
    providers: [NotificationService],
})
export class NotificationModule { }