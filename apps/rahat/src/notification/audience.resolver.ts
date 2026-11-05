// rahat-platform/apps/rahat/src/notification/audience.resolver.ts
import { createMongoAbility, MongoAbility, RawRuleOf } from '@casl/ability';
import { Injectable, Logger } from '@nestjs/common';
import { AudienceType, NotificationAudience, Prisma } from '@prisma/client';
import type { NotificationPermission } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';

type AppAbility = MongoAbility<[string, string]>;
export type AudienceRow = Pick<NotificationAudience, 'type' | 'value' | 'exclude'>;

export interface AudienceUser {
    uuid: string;
    email: string | null;
    phone: string | null;
}

const isPermission = (v: unknown): v is NotificationPermission =>
    !!v && typeof v === 'object' &&
    typeof (v as any).action === 'string' && typeof (v as any).subject === 'string';

@Injectable()
export class AudienceResolver {
    private readonly logger = new Logger(AudienceResolver.name);

    constructor(private readonly prisma: PrismaService) { }

    /** (all include rows) minus (all exclude rows), soft-deleted users dropped. */
    async resolve(rows: AudienceRow[], projectId?: string): Promise<AudienceUser[]> {
        const included = await this.collect(rows.filter((r) => !r.exclude), projectId);
        if (!included.size) return [];

        const excluded = rows.filter((r) => r.exclude);
        if (excluded.length) {
            (await this.collect(excluded, projectId)).forEach((id) => included.delete(id));
        }
        if (!included.size) return [];

        return this.prisma.user.findMany({
            where: { uuid: { in: [...included] }, deletedAt: null },
            select: { uuid: true, email: true, phone: true },
        });
    }

    private async collect(rows: AudienceRow[], projectId?: string): Promise<Set<string>> {
        const ids = new Set<string>();
        const roles: string[] = [];
        const permissions: NotificationPermission[] = [];
        let wantAll = false;
        let wantProjectMembers = false;

        for (const row of rows) {
            switch (row.type) {
                case AudienceType.USER:
                    if (typeof row.value === 'string') ids.add(row.value);
                    break;
                case AudienceType.ROLE:
                    if (typeof row.value === 'string') roles.push(row.value);
                    break;
                case AudienceType.PERMISSION:
                    if (isPermission(row.value)) permissions.push(row.value);
                    break;
                case AudienceType.PROJECT_MEMBERS:
                    wantProjectMembers = true;
                    break;
                case AudienceType.ALL:
                    wantAll = true;
                    break;
            }
        }

        if (wantAll) {
            const users = await this.prisma.user.findMany({ where: { deletedAt: null }, select: { uuid: true } });
            users.forEach((u) => ids.add(u.uuid));
        }
        if (wantProjectMembers) {
            if (projectId) (await this.byProjectMembers(projectId)).forEach((id) => ids.add(id));
            else this.logger.warn('[AUDIENCE] PROJECT_MEMBERS requested but notification has no projectId, ignored');
        }
        if (roles.length) (await this.byRoles(roles, projectId)).forEach((id) => ids.add(id));
        if (permissions.length) (await this.byPermissions(permissions, projectId)).forEach((id) => ids.add(id));

        return ids;
    }

    // expired user-roles / roles and soft-deleted users never match
    private active(): Prisma.UserRoleWhereInput[] {
        const now = new Date();
        return [
            { OR: [{ expiry: null }, { expiry: { gt: now } }] },
            { Role: { OR: [{ expiry: null }, { expiry: { gt: now } }] } },
            { User: { deletedAt: null } },
        ];
    }

    // with projectId: global roles + that project's roles. Without: any scope.
    private scoped(projectId?: string): Prisma.UserRoleWhereInput {
        const and = this.active();
        if (projectId) and.push({ OR: [{ xrefId: null }, { xrefId: projectId }] });
        return { AND: and };
    }

    private async byProjectMembers(projectId: string): Promise<string[]> {
        const rows = await this.prisma.userRole.findMany({
            where: { AND: [...this.active(), { xrefId: projectId }] },
            select: { User: { select: { uuid: true } } },
        });
        return rows.map((r) => r.User.uuid);
    }

    private async byRoles(roles: string[], projectId?: string): Promise<string[]> {
        const rows = await this.prisma.userRole.findMany({
            where: { AND: [this.scoped(projectId), { Role: { name: { in: roles } } }] },
            select: { User: { select: { uuid: true } } },
        });
        return rows.map((r) => r.User.uuid);
    }

    private async byPermissions(perms: NotificationPermission[], projectId?: string): Promise<string[]> {
        const scope = this.scoped(projectId);

        // 1) candidates: users with a non-inverted rule that could match
        //    (CASL: action 'manage' and subject 'all' are wildcards)
        const candidates = await this.prisma.userRole.findMany({
            where: {
                AND: [
                    scope,
                    {
                        Role: {
                            Permission: {
                                some: {
                                    inverted: false,
                                    OR: perms.map((p) => ({
                                        action: { in: [p.action, 'manage'] },
                                        subject: { in: [p.subject, 'all'] },
                                    })),
                                },
                            },
                        },
                    },
                ],
            },
            select: { userId: true },
            distinct: ['userId'],
        });
        if (!candidates.length) return [];

        // 2) full rule sets for those users, so `inverted` (cannot) rules are honoured
        const rows = await this.prisma.userRole.findMany({
            where: { AND: [scope, { userId: { in: candidates.map((c) => c.userId) } }] },
            select: {
                userId: true,
                User: { select: { uuid: true } },
                Role: { select: { Permission: true } },
            },
        });

        const byUser = new Map<number, { uuid: string; rules: RawRuleOf<AppAbility>[] }>();
        for (const row of rows) {
            const entry = byUser.get(row.userId) ?? { uuid: row.User.uuid, rules: [] };
            for (const p of row.Role.Permission) {
                entry.rules.push({
                    action: p.action,
                    subject: p.subject,
                    inverted: p.inverted,
                    ...(p.reason ? { reason: p.reason } : {}),
                });
            }
            byUser.set(row.userId, entry);
        }

        const matched: string[] = [];
        for (const { uuid, rules } of byUser.values()) {
            rules.sort((a, b) => Number(a.inverted) - Number(b.inverted)); // CASL: last matching rule wins, so "cannot" goes last
            const ability = createMongoAbility<AppAbility>(rules);
            if (perms.some((p) => ability.can(p.action, p.subject))) matched.push(uuid);
        }
        return matched;
    }
}