import { createMongoAbility } from '@casl/ability';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@rumsan/prisma';

/** Metadata key set by the `@rumsan/user` CheckAbilities decorator. */
const CHECK_ABILITY_KEY = 'check_ability';

/**
 * DB-backed drop-in for the package `AbilitiesGuard` on platform (global) routes.
 * Same `@CheckAbilities({ actions, subject })` contract and same denial message,
 * but evaluates global permissions (`UserRole.xrefId IS NULL`, non-expired)
 * fresh from the DB instead of the login-time JWT snapshot, so platform role
 * edits apply without logout. Service-to-service calls pass through.
 */
@Injectable()
export class DbAbilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules =
      this.reflector.get<{ actions: string | string[]; subject: string }>(
        CHECK_ABILITY_KEY,
        context.getHandler()
      ) || ({} as { actions?: string | string[]; subject?: string });
    const { actions, subject } = rules;
    if (!subject || !actions) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user?.role === 'INTERNAL_SERVICE') return true;

    let userId: number | null = null;
    if (user?.uuid) {
      const dbUser = await this.prisma.user.findUnique({
        where: { uuid: user.uuid },
        select: { id: true },
      });
      userId = dbUser?.id ?? null;
    } else if (typeof user?.id === 'number') {
      userId = user.id;
    }
    if (!userId) throw new UnauthorizedException('User not authenticated.');

    const assignments = await this.prisma.userRole.findMany({
      where: {
        userId,
        xrefId: null,
        OR: [{ expiry: null }, { expiry: { gt: new Date() } }],
      },
      include: { Role: { include: { Permission: true } } },
    });
    const ruleset = assignments
      .flatMap((a) => a.Role.Permission)
      .map((perm) => {
        const rule: any = { action: perm.action, subject: perm.subject };
        if ((perm as any).inverted) rule.inverted = true;
        const conditions = (perm as any).conditions;
        if (conditions) {
          rule.conditions =
            typeof conditions === 'string'
              ? JSON.parse(conditions)
              : conditions;
        }
        return rule;
      });
    const ability = createMongoAbility(ruleset);
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    const allowed = actionsArray.some((action) =>
      ability.can(action, subject)
    );
    if (!allowed) {
      throw new ForbiddenException(
        'User does not have permission to perform this action.'
      );
    }
    return true;
  }
}
