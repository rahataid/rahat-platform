import { UserRoles } from '@rahataid/sdk';

export function getDefaultPushRoles(): string[] {
  // const env = process.env.PUSH_DEFAULT_ROLES?.split(',').map((role) => role.trim()).filter(Boolean);
  // return env?.length ? env : [UserRoles.ADMIN, UserRoles.MANAGER];
  return [UserRoles.ADMIN, UserRoles.MANAGER];

}
