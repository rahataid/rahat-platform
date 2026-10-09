//rahat-platform/apps/rahat/src/notification/push.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Notification } from '@prisma/client';
import { APP_JOBS, BQUEUE, UserRoles } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { SubscribeWebPushDto } from './dto/subscribe-web-push.dto';
import { FirebaseService, PushPayload } from './firebase.service';
import { WebPushPayload, WebPushService, WebPushTarget } from './web-push.service';

const PAGE_SIZE = Number(process.env.PUSH_PAGE_SIZE ?? 500);
// above this many devices per channel, work goes to the queue instead of running inline
const QUEUE_THRESHOLD = Number(process.env.PUSH_QUEUE_THRESHOLD ?? 1000);
const PUSH_JOB_OPTS = {
    attempts: 3,
    removeOnComplete: true,
    backoff: { type: 'exponential', delay: 1000 },
};


export interface PushOptions {
    enabled?: boolean;                 // false = skip push for this notification
    roles?: string[];                  // audience by role name
    userIds?: string[];                // audience by user uuid (overrides roles)
    data?: Record<string, any>;        // extra deep-link data
}

// Maps existing `group` values (emitted today by triggers) to a type the app can route on.
const GROUP_TO_TYPE: Record<string, string> = {
    'Phase Acivation': 'PHASE_ACTIVATED',   // spelling matches the triggers code
    'Trigger Statement': 'TRIGGER_MET',
};

@Injectable()
export class PushService {
    private readonly logger = new Logger(PushService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly firebase: FirebaseService,
        private readonly webPush: WebPushService,
        @InjectQueue(BQUEUE.RAHAT) private readonly rahatQueue: Queue
    ) { }

    // ---------- device registration (called only by the mobile app) ----------

    private async resolveUserUuid(user?: any): Promise<string | null> {

        if (user?.uuid) {
            return user.uuid;
        }
        if (user?.id != null) {
            const u = await this.prisma.user.findUnique({
                where: { id: Number(user.id) },
                select: { uuid: true },
            });
            return u?.uuid ?? null;
        }

        return null;
    }

    async registerDevice(dto: RegisterDeviceDto & { user?: any }) {

        const userId = await this.resolveUserUuid(dto.user);
        if (!userId) {
            this.logger.error('[DEVICE] Could not resolve the logged-in user for device registration');
            throw new RpcException({
                message: 'Could not resolve the logged-in user for device registration',
                code: 'DEVICE_USER_NOT_RESOLVED',
            });
        }

        const { token, platform, appId } = dto;
        const existing = await this.prisma.deviceToken.findUnique({ where: { token } });

        if (existing && existing.userId === userId && existing.active) {
            this.logger.warn(`[DEVICE] Token ${token} is already registered to a different user (${existing.userId}), reassigning to ${userId}`);
            return { registered: true, changed: false };
        }


        // token is unique: if the same phone logs in as another user, it moves to that user
        await this.prisma.deviceToken.upsert({
            where: { token },
            create: { userId, token, platform, appId },
            update: { userId, platform, appId, active: true, lastUsedAt: new Date() },
        });

        return { registered: true, changed: true };
    }

    async unregisterDevice(dto: { token: string; user?: any }) {

        const userId = await this.resolveUserUuid(dto.user);
        if (!userId) {
            this.logger.warn('[DEVICE] Could not resolve user for unregistration');
            return { unregistered: false };
        }

        if (!dto.token) {
            this.logger.warn('[DEVICE] No token provided for unregistration');
            return { unregistered: false };
        }
        const res = await this.prisma.deviceToken.updateMany({
            where: { token: dto.token, userId },
            data: { active: false },
        });

        return { unregistered: res.count > 0 };
    }

    // ---------- sending (never throws) ----------

    private defaultRoles(): string[] {

        const env = process.env.PUSH_DEFAULT_ROLES?.split(',').map((r) => r.trim()).filter(Boolean);
        const result = env?.length ? env : [UserRoles.ADMIN, UserRoles.MANAGER];

        return result;
    }

    private async userIdsByRoles(roles: string[]): Promise<string[]> {

        const users = await this.prisma.user.findMany({
            where: { deletedAt: null, UserRole: { some: { Role: { name: { in: roles } } } } },
            select: { uuid: true },
        });

        return users.map((u) => u.uuid);
    }

    async pushForNotification(notification: Notification, opts: PushOptions = {}): Promise<void> {
        try {
            if (opts.enabled === false) return;

            const userIds = opts.userIds?.length
                ? opts.userIds
                : await this.userIdsByRoles(opts.roles?.length ? opts.roles : this.defaultRoles());

            if (!userIds.length) {
                this.logger.warn('[PUSH] No users resolved, aborting push');
                return;
            }

            const pushData = {
                type: GROUP_TO_TYPE[notification.group] ?? 'GENERAL',
                notificationId: notification.id,
                group: notification.group,
                projectId: notification.projectId ?? '',
                url: opts.data?.url ?? '/tabs/notifications',
                ...(opts.data ?? {}),
            };

            // channels are independent: one failing must not block the other
            await Promise.allSettled([
                this.dispatchMobile(userIds, notification, pushData),
                this.dispatchWeb(userIds, notification, pushData),
            ]);
        } catch (err: any) {
            this.logger.error(`[PUSH] Failed (notification unaffected): ${err?.message}`, err?.stack);
        }
    }

    private async dispatchMobile(userIds: string[], notification: Notification, pushData: Record<string, any>) {
        if (!this.firebase.enabled) {
            this.logger.log('[PUSH][MOBILE] Firebase disabled, skipping mobile push');
            return;
        }
        try {
            const where = { userId: { in: userIds }, active: true };
            const total = await this.prisma.deviceToken.count({ where });
            if (!total) {
                this.logger.warn('[PUSH][MOBILE] No active mobile devices for the resolved users');
                return;
            }

            const payload: PushPayload = { title: notification.title, body: notification.description, data: pushData };
            const useQueue = total > QUEUE_THRESHOLD;
            this.logger.log(`[PUSH][MOBILE] ${total} device(s), mode=${useQueue ? 'queue' : 'inline'}`);

            let cursor: number | undefined;
            while (true) {
                const rows = await this.prisma.deviceToken.findMany({
                    where,
                    select: { id: true, token: true },
                    orderBy: { id: 'asc' },
                    take: PAGE_SIZE,
                    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
                });
                if (!rows.length) break;
                cursor = rows[rows.length - 1].id;
                const tokens = rows.map((r) => r.token);

                if (useQueue) await this.rahatQueue.add(APP_JOBS.PUSH_SEND_FCM, { tokens, payload }, PUSH_JOB_OPTS);
                else await this.deliverFcm(tokens, payload);

                if (rows.length < PAGE_SIZE) break;
            }
        } catch (err: any) {
            this.logger.error(`[PUSH][MOBILE] dispatch failed: ${err?.message}`, err?.stack);
        }
    }

    private async dispatchWeb(userIds: string[], notification: Notification, pushData: Record<string, any>) {
        if (!this.webPush?.enabled) {
            this.logger.log('[PUSH][WEB] WebPush disabled, skipping web push');
            return;
        }
        try {
            const where = { userId: { in: userIds }, active: true };
            const total = await this.prisma.webPushSubscription.count({ where });
            if (!total) {
                this.logger.warn('[PUSH][WEB] No active web subscriptions for the resolved users');
                return;
            }

            const payload: WebPushPayload = {
                title: notification.title,
                body: notification.description,
                url: (pushData.url as string) ?? '/tabs/notifications',
                data: pushData,
            };
            const useQueue = total > QUEUE_THRESHOLD;
            this.logger.log(`[PUSH][WEB] ${total} subscription(s), mode=${useQueue ? 'queue' : 'inline'}`);

            let cursor: number | undefined;
            while (true) {
                const rows = await this.prisma.webPushSubscription.findMany({
                    where,
                    select: { id: true, endpoint: true, p256dh: true, auth: true },
                    orderBy: { id: 'asc' },
                    take: PAGE_SIZE,
                    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
                });
                if (!rows.length) break;
                cursor = rows[rows.length - 1].id;
                const subs: WebPushTarget[] = rows.map(({ endpoint, p256dh, auth }) => ({ endpoint, p256dh, auth }));

                if (useQueue) await this.rahatQueue.add(APP_JOBS.PUSH_SEND_WEB, { subs, payload }, PUSH_JOB_OPTS);
                else await this.deliverWeb(subs, payload);

                if (rows.length < PAGE_SIZE) break;
            }
        } catch (err: any) {
            this.logger.error(`[PUSH][WEB] dispatch failed: ${err?.message}`, err?.stack);
        }
    }

    // Used inline AND by the queue worker
    async deliverFcm(tokens: string[], payload: PushPayload) {
        const res = await this.firebase.sendToTokens(tokens, payload);
        if (res.invalidTokens.length) {
            // deactivate (not delete): if the device re-registers, case c reactivates the same row
            await this.prisma.deviceToken.updateMany({
                where: { token: { in: res.invalidTokens } },
                data: { active: false },
            });
        }
        this.logger.log(`[PUSH][MOBILE] batch done: ok=${res.successCount} failed=${res.failureCount} deactivated=${res.invalidTokens.length}`);
        return res;
    }

    async deliverWeb(subs: WebPushTarget[], payload: WebPushPayload) {
        const res = await this.webPush.sendToSubscriptions(subs, payload);
        if (res.invalidEndpoints.length) {
            await this.prisma.webPushSubscription.updateMany({
                where: { endpoint: { in: res.invalidEndpoints } },
                data: { active: false },
            });
        }
        this.logger.log(`[PUSH][WEB] batch done: ok=${res.successCount} failed=${res.failureCount} deactivated=${res.invalidEndpoints.length}`);
        return res;
    }

    async registerWebPush(dto: SubscribeWebPushDto & { user?: any }) {

        try {
            const userId = await this.resolveUserUuid(dto.user);

            if (!userId) {
                this.logger.error('[WEBPUSH] Could not resolve user');
                throw new RpcException({
                    message: 'Could not resolve the logged-in user for web push subscription',
                    code: 'DEVICE_USER_NOT_RESOLVED',
                });
            }

            const { endpoint, keys, userAgent } = dto;
            const existing = await this.prisma.webPushSubscription.findUnique({ where: { endpoint } });

            if (existing && existing.userId === userId && existing.active && existing.p256dh === keys.p256dh && existing.auth === keys.auth) {
                return { registered: true, changed: false };
            }


            const result = await this.prisma.webPushSubscription.upsert({
                where: { endpoint: dto.endpoint },
                create: { userId, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth, userAgent: dto.userAgent },
                update: { userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth, userAgent: dto.userAgent, active: true, lastSeenAt: new Date() },
            });


            return { registered: true, changed: true, data: result };
        } catch (err: any) {
            this.logger.error(`[WEBPUSH] registerWebPush THREW: ${err?.message}`, err?.stack);
            if (err instanceof RpcException) throw err;

            throw new RpcException(err?.message || 'Failed to process web push subscription');
        }
    }


    async unregisterWebPush(dto: { endpoint: string; user?: any }) {
        const userId = await this.resolveUserUuid(dto.user);
        if (!userId || !dto.endpoint) return { unregistered: false };

        const res = await this.prisma.webPushSubscription.updateMany({
            where: { endpoint: dto.endpoint, userId },
            data: { active: false }
        });
        return { unregistered: res.count > 0 };
    }

    getWebPushPublicKey(): string | null {
        return this.webPush.getPublicKey();
    }
}