import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

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

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private app: App | null = null;

    get enabled(): boolean {
        return this.app !== null;
    }

    onModuleInit() {
        if (process.env.PUSH_ENABLED !== 'true') {
            return;
        }
        try {
            const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
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

        for (let i = 0; i < tokens.length; i += 500) {
            const chunk = tokens.slice(i, i + 500);
            const res = await messaging.sendEachForMulticast({
                tokens: chunk,
                notification: { title: payload.title, body: payload.body },
                data,
                android: { priority: 'high' },
                apns: { payload: { aps: { sound: 'default' } } },
            });
            result.successCount += res.successCount;
            result.failureCount += res.failureCount;
            res.responses.forEach((r, idx) => {
                if (!r.success && r.error) {
                    this.logger.warn(`[FCM] Token ${chunk[idx]} failed: ${r.error.code} - ${r.error.message}`);
                    if (DEAD_TOKEN_CODES.has(r.error.code)) result.invalidTokens.push(chunk[idx]);
                }
            });
        }
        return result;
    }
}