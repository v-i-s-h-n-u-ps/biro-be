import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { Role } from 'src/common/constants/rbac.enum';
import { User } from 'src/users/entities/users.entity';

import {
  REQUIRE_ALL_ROLES_KEY,
  ROLES_KEY,
} from '../decorators/roles.decorator';

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

    const request = context.switchToHttp().getRequest<Request>();
    const user: User | undefined = request.user;

    if (!user) throw new ForbiddenException('User not authenticated');

    if (user.username === 'superuser') return true;

    const userRoles = user.roles.map((r) => r.id);

    const hasRole = requireAll
      ? requiredRoles.every((r) => userRoles.includes(r))
      : requiredRoles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      throw new ForbiddenException('You do not have enough permissions');
    }

    return true;
  }
}
