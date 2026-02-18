import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@rumsan/prisma';
import { CaslRule, UserContext } from '../types';

interface RolesAndPermissions {
  roles: string[];
  permissions: CaslRule[];
}

/**
 * Load a user's active (non-expired) roles and their associated permissions.
 * Skips roles where Role.expiry < now, and UserRole assignments where UserRole.expiry < now.
 */
export async function loadUserRolesAndPermissions(
  prisma: PrismaService,
  userId: number,
): Promise<RolesAndPermissions> {
  const now = new Date();

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      OR: [{ expiry: null }, { expiry: { gt: now } }],
      Role: {
        OR: [{ expiry: null }, { expiry: { gt: now } }],
      },
    },
    include: {
      Role: {
        include: {
          Permission: true,
        },
      },
    },
  });

  const roles: string[] = [];
  const permissions: CaslRule[] = [];

  for (const ur of userRoles) {
    roles.push(ur.Role.name);
    for (const perm of ur.Role.Permission) {
      permissions.push({
        action: perm.action,
        subject: perm.subject,
        inverted: perm.inverted,
        ...(perm.conditions ? { conditions: perm.conditions as Record<string, any> } : {}),
      });
    }
  }

  return { roles, permissions };
}

/**
 * Build a signed JWT containing user identity, roles, and CASL permissions.
 */
export async function buildJwt(
  jwtService: JwtService,
  prisma: PrismaService,
  user: { id: number; uuid: string; name: string | null },
  sessionId: string,
): Promise<string> {
  const { roles, permissions } = await loadUserRolesAndPermissions(prisma, user.id);

  const payload: UserContext = {
    sub: user.uuid,
    userId: user.id,
    name: user.name ?? '',
    roles,
    permissions,
    sessionId,
  };

  return jwtService.sign(payload);
}
