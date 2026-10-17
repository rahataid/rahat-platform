// rahat-platform/apps/rahat/src/notification/sms.service.ts   (TODO : IT NOT REQUIRE RIGHT NOW , BUT KEEPING IT FOR FUTURE USE)
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { backoffDelay, chunk, sleep } from './utils/push.utils';
import { getSecretSetting } from './utils/secret-settings';

const SPARROW_URL = process.env.SPARROW_SMS_URL || 'https://api.sparrowsms.com/v2/sms/';
const BATCH_SIZE = 100;
const MAX_RETRIES = 2;

@Injectable()
export class SmsService implements OnModuleInit {
    private readonly logger = new Logger(SmsService.name);
    private token: string | null = null;
    private from: string | null = null;

    constructor(private readonly prisma: PrismaService) { }

    get enabled(): boolean {
        return !!(this.token && this.from);
    }

    async onModuleInit() {
        // DB setting first (same pattern as Firebase/VAPID), env as fallback
        this.token = await getSecretSetting(this.prisma, 'SPARROW_SMS_TOKEN', process.env.SPARROW_SMS_TOKEN);
        this.from = await getSecretSetting(this.prisma, 'SPARROW_SMS_FROM', process.env.SPARROW_SMS_FROM);
        if (!this.enabled) {
            this.logger.warn('[SMS] SPARROW_SMS_TOKEN / SPARROW_SMS_FROM missing. SMS DISABLED.');
        }
    }

    // Assumes Nepali numbers: keep the last 10 digits (strips +977 / spaces / dashes). Adjust if you send abroad.
    private normalize(phone: string): string {
        const digits = phone.replace(/\D/g, '');
        return digits.length > 10 ? digits.slice(-10) : digits;
    }

    async send(phones: string[], text: string): Promise<{ sent: number; failed: number }> {
        const numbers = [...new Set(phones.map((p) => this.normalize(p)).filter(Boolean))];
        if (!this.enabled) {
            this.logger.warn(`[SMS] Disabled, skipping ${numbers.length} recipient(s)`);
            return { sent: 0, failed: numbers.length };
        }

        let sent = 0;
        let failed = 0;
        for (const batch of chunk(numbers, BATCH_SIZE)) {
            if (await this.sendBatch(batch, text)) sent += batch.length;
            else failed += batch.length;
        }
        this.logger.log(`[SMS] done: sent=${sent} failed=${failed}`);
        return { sent, failed };
    }

    private async sendBatch(numbers: string[], text: string): Promise<boolean> {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const res = await fetch(SPARROW_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        token: this.token as string,
                        from: this.from as string,
                        to: numbers.join(','),
                        text,
                    }),
                    signal: AbortSignal.timeout(15000),
                });
                if (res.ok) return true;

                const transient = res.status === 429 || res.status >= 500;
                if (!transient || attempt === MAX_RETRIES) {
                    this.logger.error(`[SMS] Batch failed (${res.status}): ${(await res.text().catch(() => '')).slice(0, 200)}`);
                    return false;
                }
            } catch (err: any) {
                if (attempt === MAX_RETRIES) {
                    this.logger.error(`[SMS] Batch failed after ${attempt + 1} attempts: ${err?.message}`);
                    return false;
                }
            }
            await sleep(backoffDelay(attempt));
        }
        return false;
    }
}