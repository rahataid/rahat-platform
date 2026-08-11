import { createMongoAbility, MongoAbility, RawRuleOf } from '@casl/ability';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '@rumsan/prisma';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './ability.constants';
import { CheckAbilityDTO } from './dto/checkAbility.dto';

type AppAbility = MongoAbility<[string, string]>;

@Injectable()
export class AbilityService {
    private readonly logger = new Logger(AbilityService.name);
    private readonly cacheTtl: number = 300;

    constructor(
        private readonly prisma: PrismaService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis
    ) { }

    async checkAbility(dto: CheckAbilityDTO): Promise<{ allowed: boolean }> {
        const { userId, action, subject, projectId: xrefId } = dto;

        this.logger.log(
            `[AbilityCheck] userId=${userId} | action=${action} | subject=${subject}${xrefId ? ` | projectId=${xrefId}` : ' | scope=global'}`
        );
        const rules = await this.getUserPermissions(userId, xrefId);
        const ability = this.buildAbility(rules);

        if (!ability.can(action, subject)) {
            throw new RpcException({
                statusCode: 403,
                message: `Forbidden: cannot perform '${action}' on '${subject}'`,
            });
        }

        return { allowed: true };
    }

    async invalidateCache(userId: number, xrefId?: string): Promise<void> {
        this.logger.debug(`Removing cache of user : ${userId} with project :${xrefId}`)
        const cacheKey = `ability:${userId}${xrefId ? `:${xrefId}` : ''}`;
        await this.redis.del(cacheKey).catch(() => null);
        this.logger.debug(`Cache invalidated for ${cacheKey}`);
    }

    async invalidateCacheByRole(roleName: string): Promise<void> {
        this.logger.debug(`Invalidating cache for role: ${roleName}`);

        const userRoles = await this.prisma.userRole.findMany({
            where: { Role: { name: roleName } },
            select: { userId: true },
            distinct: ['userId'],
        });

        if (!userRoles.length) {
            this.logger.debug(`No users found for role: ${roleName}`);
            return;
        }

        await Promise.all(
            userRoles.map((ur) => this.invalidateAllCacheForUser(ur.userId))
        );

        this.logger.debug(
            `Invalidated ability cache for ${userRoles.length} user(s) with role: ${roleName}`
        );
    }

    private async invalidateAllCacheForUser(userId: number): Promise<void> {
        const pattern = `ability:${userId}*`;
        const keys: string[] = [];

        await new Promise<void>((resolve, reject) => {
            const stream = this.redis.scanStream({ match: pattern, count: 100 });
            stream.on('data', (resultKeys: string[]) => keys.push(...resultKeys));
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        if (keys.length) {
            await this.redis.del(...keys).catch(() => null);
        }
    }

    private async getUserPermissions(
        userId: number,
        projectId?: string
    ): Promise<RawRuleOf<AppAbility>[]> {
        const cacheKey = `ability:${userId}${projectId ? `:${projectId}` : ''}`;

        const cached = await this.redis.get(cacheKey).catch(() => null);
        if (cached) {
            this.logger.debug(`Cache hit for ${cacheKey}`);
            return JSON.parse(cached) as RawRuleOf<AppAbility>[];
        }

        // Always fetch global (admin) roles (xrefId = null) + project-scoped roles if projectId given
        const whereConditions = projectId
            ? {
                OR: [
                    { userId, xrefId: null },
                    { userId, xrefId: projectId },
                ],
            }
            : { userId, xrefId: null };

        const userRoles = await this.prisma.userRole.findMany({
            where: whereConditions,
            include: {
                Role: {
                    include: {
                        Permission: true,
                    },
                },
            },
        });

        if (!userRoles.length) {
            throw new RpcException({
                statusCode: 403,
                message: 'Forbidden: no roles assigned to this user',
            });
        }

        const rules: RawRuleOf<AppAbility>[] = userRoles.flatMap((ur) =>
            ur.Role.Permission.map((p) => ({
                action: p.action,
                subject: p.subject,
                inverted: p.inverted,
                ...(p.conditions
                    ? { conditions: p.conditions as Record<string, unknown> }
                    : {}),
                ...(p.reason ? { reason: p.reason } : {}),
            }))
        );

        await this.redis
            .set(cacheKey, JSON.stringify(rules), 'EX', this.cacheTtl)
            .catch(() => null);

        return rules;
    }

    private buildAbility(rules: RawRuleOf<AppAbility>[]): AppAbility {
        return createMongoAbility<AppAbility>(rules);
    }
}
