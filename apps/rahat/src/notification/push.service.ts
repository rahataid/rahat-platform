import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Notification } from '@prisma/client';
import { UserRoles } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { FirebaseService } from './firebase.service';

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
        private readonly firebase: FirebaseService
    ) { }

    // ---------- device registration (called only by the mobile app) ----------

    private async resolveUserUuid(user?: any): Promise<string | null> {
        this.logger.log(`[DEVICE] Resolving user UUID. User object keys: ${user ? Object.keys(user).join(', ') : 'null'}`);
        if (user?.uuid) {
            this.logger.log(`[DEVICE] User has uuid: ${user.uuid}`);
            return user.uuid;
        }
        if (user?.id != null) {
            const u = await this.prisma.user.findUnique({
                where: { id: Number(user.id) },
                select: { uuid: true },
            });
            this.logger.log(`[DEVICE] User lookup by id=${user.id}, found: ${!!u}, uuid: ${u?.uuid ?? 'null'}`);
            return u?.uuid ?? null;
        }
        this.logger.warn('[DEVICE] Cannot resolve user UUID - no uuid or id in user object');
        return null;
    }

    async registerDevice(dto: RegisterDeviceDto & { user?: any }) {
        this.logger.log(`[DEVICE] Registering device for user. Has user object: ${!!dto.user}`);
        const userId = await this.resolveUserUuid(dto.user);
        if (!userId) {
            this.logger.error('[DEVICE] Could not resolve the logged-in user for device registration');
            throw new RpcException({
                message: 'Could not resolve the logged-in user for device registration',
                code: 'DEVICE_USER_NOT_RESOLVED',
            });
        }
        this.logger.log(`[DEVICE] Resolved userId: ${userId}`);
        const { token, platform, appId } = dto;
        this.logger.log(`[DEVICE] Registering token=${token.substring(0, 16)}... platform=${platform}, appId=${appId}`);

        // token is unique: if the same phone logs in as another user, it moves to that user
        await this.prisma.deviceToken.upsert({
            where: { token },
            create: { userId, token, platform, appId },
            update: { userId, platform, appId, active: true, lastUsedAt: new Date() },
        });
        this.logger.log(`[DEVICE] Device registered successfully`);
        return { registered: true };
    }

    async unregisterDevice(dto: { token: string; user?: any }) {
        this.logger.log(`[DEVICE] Unregistering device. Has user object: ${!!dto.user}`);
        const userId = await this.resolveUserUuid(dto.user);
        if (!userId) {
            this.logger.warn('[DEVICE] Could not resolve user for unregistration');
            return { unregistered: false };
        }
        this.logger.log(`[DEVICE] Resolved userId: ${userId}, token: ${dto.token.substring(0, 16)}...`);
        if (!dto.token) {
            this.logger.warn('[DEVICE] No token provided for unregistration');
            return { unregistered: false };
        }
        const res = await this.prisma.deviceToken.deleteMany({
            where: { token: dto.token, userId },
        });
        this.logger.log(`[DEVICE] Unregister result: ${res.count} tokens deleted`);
        return { unregistered: res.count > 0 };
    }

    // ---------- sending (never throws) ----------

    private defaultRoles(): string[] {
        this.logger.log(`[PUSH] PUSH_DEFAULT_ROLES env var: "${process.env.PUSH_DEFAULT_ROLES}"`);
        const env = process.env.PUSH_DEFAULT_ROLES?.split(',').map((r) => r.trim()).filter(Boolean);
        const result = env?.length ? env : [UserRoles.ADMIN, UserRoles.MANAGER];
        this.logger.log(`[PUSH] Default roles resolved to: ${result.join(', ')}`);
        return result;
    }

    private async userIdsByRoles(roles: string[]): Promise<string[]> {
        this.logger.log(`[PUSH] Querying users by roles: ${roles.join(', ')}`);
        const users = await this.prisma.user.findMany({
            where: { deletedAt: null, UserRole: { some: { Role: { name: { in: roles } } } } },
            select: { uuid: true },
        });
        this.logger.log(`[PUSH] Found ${users.length} users with roles: ${roles.join(', ')}`);
        return users.map((u) => u.uuid);
    }

    async pushForNotification(notification: Notification, opts: PushOptions = {}): Promise<void> {
        this.logger.log(`[PUSH] Starting push for notification ID: ${notification.id}, title: "${notification.title}", group: ${notification.group}`);
        try {
            if (!this.firebase.enabled || opts.enabled === false) {
                this.logger.log(`[PUSH] Skipping push - firebase.enabled=${this.firebase.enabled}, opts.enabled=${opts.enabled}`);
                return;
            }

            const userIds = opts.userIds?.length
                ? (this.logger.log(`[PUSH] Using explicit user IDs: ${opts.userIds.join(', ')}`), opts.userIds)
                : (this.logger.log(`[PUSH] Resolving users by roles: ${opts.roles ?? 'default'}`), await this.userIdsByRoles(opts.roles?.length ? opts.roles : this.defaultRoles()));
            this.logger.log(`[PUSH] Resolved ${userIds.length} user IDs for push`);
            if (!userIds.length) {
                this.logger.warn('[PUSH] No users resolved, aborting push');
                return;
            }

            const rows = await this.prisma.deviceToken.findMany({
                where: { userId: { in: userIds }, active: true },
                select: { token: true },
            });
            const tokens = rows.map((r) => r.token);
            this.logger.log(`[PUSH] Found ${tokens.length} active device tokens for ${userIds.length} users`);
            if (!tokens.length) {
                this.logger.warn('[PUSH] No registered mobile devices found for the resolved users');
                return;
            }

            const res = await this.firebase.sendToTokens(tokens, {
                title: notification.title,
                body: notification.description,
                data: {
                    type: GROUP_TO_TYPE[notification.group] ?? 'GENERAL',
                    notificationId: notification.id,
                    group: notification.group,
                    projectId: notification.projectId ?? '',
                    ...(opts.data ?? {}),
                },
            });

            if (res.invalidTokens.length) {
                await this.prisma.deviceToken.deleteMany({ where: { token: { in: res.invalidTokens } } });
                this.logger.log(`[PUSH] Removed ${res.invalidTokens.length} stale device tokens`);
            }
            this.logger.log(
                `[PUSH] Complete: ${res.successCount} ok, ${res.failureCount} failed, ${res.invalidTokens.length} stale removed`
            );
        } catch (err: any) {
            this.logger.error(`[PUSH] Failed (notification unaffected): ${err?.message}`, err?.stack);
        }
    }
}