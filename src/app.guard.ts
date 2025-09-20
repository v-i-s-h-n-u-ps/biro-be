// src/app.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { FirebaseAuthGuard } from './authentication/guards/firebase-auth.guard';
import { PermissionsGuard } from './authorization/rbac/guards/permissions.guard';
import { RolesGuard } from './authorization/rbac/guards/roles.guard';
import { IS_PUBLIC_KEY } from './common/decorators/public.decorator';

@Injectable()
export class AppGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authGuard: FirebaseAuthGuard,
    private readonly rolesGuard: RolesGuard,
    private readonly permissionsGuard: PermissionsGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isAuthenticated = await this.authGuard.canActivate(context);
    if (!isAuthenticated) return false;

    const hasRole = this.rolesGuard.canActivate(context);
    if (!hasRole) return false;

    const hasPermission = this.permissionsGuard.canActivate(context);
    if (!hasPermission) return false;

    return true;
  }
}
