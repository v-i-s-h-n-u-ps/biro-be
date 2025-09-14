import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
} from '../decorators/permission.decorator';
import { User } from 'src/users/entities/users.entity';
import { Permission } from 'src/common/constants/rbac.enum';

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

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('User not authenticated');
    }

    // Flatten all permissions from all roles
    const userPermissions = user.roles.flatMap((r) =>
      r.permissions.map((p) => p.id),
    );

    const hasPermission = requireAll
      ? requiredPermissions.every((p) => userPermissions.includes(p))
      : requiredPermissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException(
        `Required ${requireAll ? 'ALL' : 'ANY'} of permissions: [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
