import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@rumsan/prisma';
import Redis from 'ioredis';
import { loadUserRolesAndPermissions } from '../auth/auth.helpers';
import { CaslRule } from '../types';

type AppAbility = MongoAbility<[string, string]>;

@Injectable()
export class AbilityService {
  private readonly logger = new Logger(AbilityService.name);
  private readonly redis: Redis;
  private readonly cacheTtl: number = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  /** Check if a user can perform an action on a subject. */
  async checkAbility(payload: {
    userId: number;
    action: string;
    subject: string;
    conditions?: any;
  }): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { userId, action, subject } = payload;

      const cacheKey = `ability:${userId}:${action}:${subject}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        this.logger.log(`Getting data from cache using key ${cacheKey}`);
        return JSON.parse(cached);
      }

      // Build ability from user's roles and permissions
      const { permissions } = await loadUserRolesAndPermissions(
        this.prisma,
        userId
      );
      console.log('user obj is: ', permissions);

      const ability = this.buildAbility(permissions);

      const allowed = ability.can(action, subject);
      console.log(
        `user allowed ${allowed} for action ${action} subject ${subject}`
      );

      const rule = ability.relevantRuleFor(action, subject);
      console.log(
        `user rule ${allowed} for action ${action} subject ${subject}`
      );

      const reason = rule?.reason;
      const result = { allowed, ...(reason ? { reason } : {}) };

      // Cache the result
      await this.redis.set(
        cacheKey,
        JSON.stringify(result),
        'EX',
        this.cacheTtl
      );

      return result;
    } catch (error) {
      this.logger.error('checkAbility failed', error);
      return { allowed: false, reason: 'Ability check failed' };
    }
  }

  /** Return all CASL rules for a user. */
  async getUserAbilities(payload: {
    userId: number;
  }): Promise<{ rules: CaslRule[] }> {
    try {
      const { permissions } = await loadUserRolesAndPermissions(
        this.prisma,
        payload.userId
      );
      return { rules: permissions };
    } catch (error) {
      this.logger.error('getUserAbilities failed', error);
      return { rules: [] };
    }
  }

  private buildAbility(permissions: CaslRule[]): AppAbility {
    const builder = new AbilityBuilder<AppAbility>(createMongoAbility);

    for (const perm of permissions) {
      if (perm.inverted) {
        builder.cannot(perm.action, perm.subject);
      } else {
        builder.can(perm.action, perm.subject);
      }
    }

    return builder.build();
  }
}
