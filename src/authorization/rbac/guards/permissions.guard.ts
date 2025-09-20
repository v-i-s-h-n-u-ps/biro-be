import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Permission } from 'src/common/constants/rbac.enum';

import {
  PERMISSIONS_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
} from '../decorators/permission.decorator';
import { getUser } from '../utils/auth-guard.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requireAll =
      this.reflector.getAllAndOverride<boolean>(REQUIRE_ALL_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const user = getUser(context);
    if (user.username === 'superuser') return true;

    const userPermissions = user.roles.flatMap((r) =>
      r.permissions.map((p) => p.id),
    );

    const hasPermission = requireAll
      ? requiredPermissions.every((p) => userPermissions.includes(p))
      : requiredPermissions.some((p) => userPermissions.includes(p));

    if (!hasPermission)
      throw new ForbiddenException('You do not have enough permissions');

    return true;
  }
}
