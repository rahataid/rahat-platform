//rahat-platform/apps/rahat/src/notification/web-push.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';

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

    get enabled(): boolean {
        return this.ready;
    }

    onModuleInit() {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;
        if (!publicKey || !privateKey) {
            this.logger.warn('[WEBPUSH] VAPID keys missing. Web push DISABLED.');
            return;
        }
        webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:support@rahat.io', publicKey, privateKey);
        this.ready = true;
    }

    getPublicKey(): string | null {
        return process.env.VAPID_PUBLIC_KEY ?? null;
    }

    async sendToSubscriptions(subs: WebPushTarget[], payload: WebPushPayload): Promise<WebPushResult> {
        const result: WebPushResult = { successCount: 0, failureCount: 0, invalidEndpoints: [] };
        if (!this.ready || subs.length === 0) return result;

        const body = JSON.stringify(payload);

        await Promise.all(
            subs.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        body
                    );
                    result.successCount++;
                } catch (err: any) {
                    result.failureCount++;
                    const status = err?.statusCode;
                    this.logger.warn(`[WEBPUSH] Send failed (${status ?? 'unknown'}) for ...${sub.endpoint.slice(-24)}: ${err?.message}`);

                    if (status === 404 || status === 410) {
                        // gone permanently — dedupe key is the endpoint, per §6.4 of your R&D doc
                        result.invalidEndpoints.push(sub.endpoint);
                    }
                    // 429 (rate limited) and 5xx (push service outage): leave the subscription
                    // active and do nothing further here. A per-send retry would need its own
                    // backoff queue — see the "weekly cleanup" note in Part E below instead of
                    // retrying synchronously, since retrying inline would block this request.
                }
            })
        );

        return result;
    }
}