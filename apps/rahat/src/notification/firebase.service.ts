import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { backoffDelay, chunk, mapWithConcurrency, sleep } from './utils/push.utils';
import { getSecretSetting } from './utils/secret-settings';

export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export interface PushResult {
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
}


const DEAD_TOKEN_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);
const INVALID_ARGUMENT_CODE = 'messaging/invalid-argument';
const TRANSIENT_CODES = new Set([
    'messaging/internal-error',
    'messaging/server-unavailable',
    'messaging/message-rate-exceeded',
    'messaging/device-message-rate-exceeded',
]);

const FCM_BATCH_SIZE = 500;
const FCM_CONCURRENCY = Number(process.env.FCM_CONCURRENCY ?? 3);
const FCM_MAX_RETRIES = 3;

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private app: App | null = null;

    get enabled(): boolean {
        return this.app !== null;
    }

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        if (process.env.PUSH_ENABLED !== 'true') {
            return;
        }
        try {
            const b64 = await getSecretSetting(this.prisma, 'FIREBASE_SERVICE_ACCOUNT_BASE64', process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
            if (!b64) {
                this.logger.warn('[FCM] FIREBASE_SERVICE_ACCOUNT_BASE64 missing. Push DISABLED.');
                return;
            }
            const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            this.app = getApps()[0] ?? initializeApp({ credential: cert(json) });
        } catch (err: any) {
            this.app = null;
            this.logger.error(`[FCM] Firebase init failed. Push DISABLED: ${err?.message}`, err?.stack);
        }
    }

    private stringify(data: Record<string, unknown> = {}): Record<string, string> {
        return Object.fromEntries(
            Object.entries(data)
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
        );
    }


    private async sendChunk(
        messaging: Messaging,
        tokens: string[],
        payload: PushPayload,
        data: Record<string, string>
    ): Promise<{ successCount: number; invalid: string[] }> {
        let pending = tokens;
        let successCount = 0;
        const invalid: string[] = [];

        for (let attempt = 0; attempt <= FCM_MAX_RETRIES && pending.length; attempt++) {
            if (attempt > 0) {
                const wait = backoffDelay(attempt - 1);
                this.logger.warn(`[FCM] Retry ${attempt}/${FCM_MAX_RETRIES} for ${pending.length} token(s) in ${wait}ms`);
                await sleep(wait);
            }

            let res;
            try {
                res = await messaging.sendEachForMulticast({
                    tokens: pending,
                    notification: { title: payload.title, body: payload.body },
                    data,
                    android: { priority: 'high' },
                    apns: { payload: { aps: { sound: 'default' } } },
                });
            } catch (err: any) {
                // whole request failed (network/5xx): retry the same tokens
                this.logger.warn(`[FCM] Multicast request threw (attempt ${attempt + 1}): ${err?.message}`);
                continue;
            }

            successCount += res.successCount;
            const retryNext: string[] = [];
            const invalidArg: string[] = [];

            res.responses.forEach((r, idx) => {
                if (r.success) return;
                const code = r.error?.code ?? '';
                const token = pending[idx];
                if (DEAD_TOKEN_CODES.has(code)) invalid.push(token);
                else if (code === INVALID_ARGUMENT_CODE) invalidArg.push(token);
                else if (TRANSIENT_CODES.has(code)) retryNext.push(token);
                else this.logger.warn(`[FCM] Permanent failure ...${token.slice(-8)}: ${code}`);
            });

            // INVALID_ARGUMENT can also mean a bad *payload*. If every token in the batch failed
            // that way, don't deactivate anything.
            if (invalidArg.length && invalidArg.length === pending.length) {
                this.logger.error('[FCM] All tokens returned INVALID_ARGUMENT, payload likely invalid. Not deactivating tokens.');
            } else {
                invalid.push(...invalidArg);
            }

            pending = retryNext;
        }

        if (pending.length) {
            this.logger.error(`[FCM] Gave up on ${pending.length} token(s) after ${FCM_MAX_RETRIES} retries (transient errors)`);
        }
        return { successCount, invalid };
    }


    async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushResult> {
        const result: PushResult = { successCount: 0, failureCount: 0, invalidTokens: [] };
        if (!this.app) {
            this.logger.error('[FCM] Firebase app not initialized');
            return result;
        }
        if (tokens.length === 0) {
            this.logger.warn('[FCM] No tokens to send');
            return result;
        }

        const messaging = getMessaging(this.app);
        const data = this.stringify(payload.data);
        const batches = chunk(tokens, FCM_BATCH_SIZE);


        const outcomes = await mapWithConcurrency(batches, FCM_CONCURRENCY, (batch) =>
            this.sendChunk(messaging, batch, payload, data)
        );

        for (const o of outcomes) {
            result.successCount += o.successCount;
            result.invalidTokens.push(...o.invalid);
        }
        result.failureCount = tokens.length - result.successCount;
        return result;
    }
}