//rahat-platform/apps/rahat/src/notification/web-push.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import * as webpush from 'web-push';
import { backoffDelay, mapWithConcurrency, sleep } from './utils/push.utils';
import { getSecretSetting } from './utils/secret-settings';


const WEBPUSH_CONCURRENCY = Number(process.env.WEBPUSH_CONCURRENCY ?? 50);
const WEBPUSH_MAX_RETRIES = 3;

type SendOutcome = 'ok' | 'invalid' | 'failed';


export interface WebPushPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    data?: Record<string, unknown>;
}

export interface WebPushTarget {
    endpoint: string;
    p256dh: string;
    auth: string;
}

export interface WebPushResult {
    successCount: number;
    failureCount: number;
    invalidEndpoints: string[]; // 404/410 → subscription is dead, safe to delete
}

@Injectable()
export class WebPushService implements OnModuleInit {
    private readonly logger = new Logger(WebPushService.name);
    private ready = false;
    private publicKey: string | null = null;

    constructor(private readonly prisma: PrismaService) { }


    get enabled(): boolean {
        return this.ready;
    }

    async onModuleInit() {
        const publicKey = await getSecretSetting(this.prisma, 'VAPID_PUBLIC_KEY', process.env.VAPID_PUBLIC_KEY);
        const privateKey = await getSecretSetting(this.prisma, 'VAPID_PRIVATE_KEY', process.env.VAPID_PRIVATE_KEY);

        if (!publicKey || !privateKey) {
            this.logger.warn('[WEBPUSH] VAPID keys missing. Web push DISABLED.');
            return;
        }
        webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:support@rahat.io', publicKey, privateKey);
        this.publicKey = publicKey;
        this.ready = true;
    }

    getPublicKey(): string | null {
        return this.publicKey;
    }

    private isTransient(status?: number): boolean {
        // no status = network error; 429 = rate limited; 5xx = push service outage
        return status === undefined || status === 408 || status === 429 || status >= 500;
    }

    private async sendOne(sub: WebPushTarget, body: string): Promise<SendOutcome> {
        for (let attempt = 0; attempt <= WEBPUSH_MAX_RETRIES; attempt++) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    body,
                    { TTL: 60 * 60, urgency: 'high' }
                );
                return 'ok';
            } catch (err: any) {
                const status: number | undefined = err?.statusCode;
                const tail = sub.endpoint.slice(-24);

                if (status === 404 || status === 410) return 'invalid'; // subscription is gone for good

                if (!this.isTransient(status) || attempt === WEBPUSH_MAX_RETRIES) {
                    this.logger.error(
                        `[WEBPUSH] Final failure (${status ?? 'network'}) for ...${tail} after ${attempt + 1} attempt(s): ${err?.message}`
                    );
                    return 'failed';
                }

                const retryAfterSec = Number(err?.headers?.['retry-after']);
                const wait = Number.isFinite(retryAfterSec) && retryAfterSec > 0
                    ? Math.min(retryAfterSec * 1000, 30000)
                    : backoffDelay(attempt);
                this.logger.warn(`[WEBPUSH] ${status ?? 'network'} for ...${tail}, retry ${attempt + 1}/${WEBPUSH_MAX_RETRIES} in ${wait}ms`);
                await sleep(wait);
            }
        }
        return 'failed';
    }


    async sendToSubscriptions(subs: WebPushTarget[], payload: WebPushPayload): Promise<WebPushResult> {
        const result: WebPushResult = { successCount: 0, failureCount: 0, invalidEndpoints: [] };
        if (!this.ready || subs.length === 0) return result;

        const body = JSON.stringify(payload);
        const outcomes = await mapWithConcurrency(subs, WEBPUSH_CONCURRENCY, (sub) => this.sendOne(sub, body));

        outcomes.forEach((o, i) => {
            if (o === 'ok') result.successCount++;
            else {
                result.failureCount++;
                if (o === 'invalid') result.invalidEndpoints.push(subs[i].endpoint);
            }
        });
        return result;
    }
}