import { SetMetadata } from '@nestjs/common';
import { Roles as RoleType } from '../types/roles';

export const Roles = (...args: RoleType[]) => SetMetadata('roles', args);
