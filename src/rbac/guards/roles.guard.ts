import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  REQUIRE_ALL_ROLES_KEY,
} from '../decorators/roles.decorator';
import { User } from 'src/users/entities/users.entity';
import { Role } from 'src/common/constants/rbac.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requireAll =
      this.reflector.getAllAndOverride<boolean>(REQUIRE_ALL_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.roles.map((r) => r.id);

    const hasRole = requireAll
      ? requiredRoles.every((r) => userRoles.includes(r))
      : requiredRoles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      throw new ForbiddenException(
        `Required ${requireAll ? 'ALL' : 'ANY'} of roles: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
