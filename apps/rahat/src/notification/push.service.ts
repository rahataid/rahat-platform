//rahat-platform/apps/rahat/src/notification/push.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Notification } from '@prisma/client';
import { UserRoles } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { SubscribeWebPushDto } from './dto/subscribe-web-push.dto';
import { FirebaseService } from './firebase.service';
import { WebPushService } from './web-push.service';

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
        private readonly webPush: WebPushService
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


        // token is unique: if the same phone logs in as another user, it moves to that user
        await this.prisma.deviceToken.upsert({
            where: { token },
            create: { userId, token, platform, appId },
            update: { userId, platform, appId, active: true, lastUsedAt: new Date() },
        });

        return { registered: true };
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
        const res = await this.prisma.deviceToken.deleteMany({
            where: { token: dto.token, userId },
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
            if (opts.enabled === false) {

                return;
            }

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

            // ---- mobile (FCM) ----
            if (this.firebase.enabled) {
                const rows = await this.prisma.deviceToken.findMany({
                    where: { userId: { in: userIds }, active: true },
                    select: { token: true },
                });
                const tokens = rows.map((r) => r.token);

                if (tokens.length) {
                    const res = await this.firebase.sendToTokens(tokens, {
                        title: notification.title,
                        body: notification.description,
                        data: pushData,
                    });

                    if (res.invalidTokens.length) {
                        await this.prisma.deviceToken.deleteMany({ where: { token: { in: res.invalidTokens } } });

                    }

                } else {
                    this.logger.warn('[PUSH][MOBILE] No registered mobile devices found for the resolved users');
                }
            } else {
                this.logger.log('[PUSH][MOBILE] Firebase disabled, skipping mobile push');
            }

            // ---- web (VAPID) ----
            if (this.webPush?.enabled) {
                const webSubs = await this.prisma.webPushSubscription.findMany({
                    where: { userId: { in: userIds }, active: true },
                    select: { endpoint: true, p256dh: true, auth: true },
                });

                if (webSubs.length) {
                    const webRes = await this.webPush.sendToSubscriptions(webSubs, {
                        title: notification.title,
                        body: notification.description,
                        url: (pushData.url as string) ?? '/tabs/notifications',
                        data: pushData,
                    });

                    if (webRes.invalidEndpoints.length) {
                        await this.prisma.webPushSubscription.deleteMany({ where: { endpoint: { in: webRes.invalidEndpoints } } });
                    }

                } else {
                    this.logger.warn('[PUSH][WEB] No registered web subscriptions found for the resolved users');
                }
            } else {
                this.logger.log('[PUSH][WEB] WebPush disabled, skipping web push');
            }
        } catch (err: any) {
            this.logger.error(`[PUSH] Failed (notification unaffected): ${err?.message}`, err?.stack);
        }
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


            if (!this.prisma.webPushSubscription) {
                this.logger.error('[WEBPUSH] ERROR: this.prisma.webPushSubscription is UNDEFINED!');
                throw new RpcException('Prisma model webPushSubscription not found');
            }

            const result = await this.prisma.webPushSubscription.upsert({
                where: { endpoint: dto.endpoint },
                create: { userId, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth, userAgent: dto.userAgent },
                update: { userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth, userAgent: dto.userAgent, active: true, lastSeenAt: new Date() },
            });


            return { registered: true, data: result };
        } catch (err: any) {
            this.logger.error(`[WEBPUSH] registerWebPush THREW: ${err?.message}`, err?.stack);
            throw new RpcException(err?.message || 'Failed to process web push subscription');
        }
    }


    async unregisterWebPush(dto: { endpoint: string; user?: any }) {
        const userId = await this.resolveUserUuid(dto.user);
        if (!userId || !dto.endpoint) return { unregistered: false };
        const res = await this.prisma.webPushSubscription.deleteMany({ where: { endpoint: dto.endpoint, userId } });
        return { unregistered: res.count > 0 };
    }

    getWebPushPublicKey(): string | null {
        return this.webPush.getPublicKey();
    }
}