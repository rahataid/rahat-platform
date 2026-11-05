// rahat-platform/apps/rahat/src/notification/push.processor.ts  (NEW)
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { APP_JOBS, BQUEUE } from '@rahataid/sdk';
import { Job } from 'bull';
import { PushPayload } from '../notification/firebase.service';
import { PushService } from '../notification/push.service';
import { WebPushPayload, WebPushTarget } from '../notification/web-push.service';

@Processor(BQUEUE.RAHAT)
export class PushProcessor {
    private readonly logger = new Logger(PushProcessor.name);

    constructor(private readonly pushService: PushService) { }

    @Process({ name: APP_JOBS.PUSH_SEND_FCM, concurrency: 2 })
    async handleFcm(job: Job<{ tokens: string[]; payload: PushPayload }>) {
        this.logger.log(`[QUEUE] FCM job ${job.id}: ${job.data.tokens.length} token(s)`);
        await this.pushService.deliverFcm(job.data.tokens, job.data.payload);
    }

    @Process({ name: APP_JOBS.PUSH_SEND_WEB, concurrency: 2 })
    async handleWeb(job: Job<{ subs: WebPushTarget[]; payload: WebPushPayload }>) {
        this.logger.log(`[QUEUE] WebPush job ${job.id}: ${job.data.subs.length} subscription(s)`);
        await this.pushService.deliverWeb(job.data.subs, job.data.payload);
    }
}