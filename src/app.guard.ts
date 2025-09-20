import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { FirebaseAuthGuard } from './authentication/guards/firebase-auth.guard';
import { WsFirebaseAuthGuard } from './authentication/guards/ws-firebase-auth.guard';
import { PermissionsGuard } from './authorization/rbac/guards/permissions.guard';
import { RolesGuard } from './authorization/rbac/guards/roles.guard';
import { IS_PUBLIC_KEY } from './common/decorators/public.decorator';

@Injectable()
export class AppGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authGuard: FirebaseAuthGuard,
    private readonly wsAuthGuard: WsFirebaseAuthGuard,
    private readonly rolesGuard: RolesGuard,
    private readonly permissionsGuard: PermissionsGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const type = context.getType();
    if (type !== 'http' && type !== 'ws') return true;

    const authGuard = type === 'http' ? this.authGuard : this.wsAuthGuard;
    if (!authGuard) return true;
    if (!(await authGuard.canActivate(context))) return false;
    if (!this.rolesGuard.canActivate(context)) return false;
    if (!this.permissionsGuard.canActivate(context)) return false;

    return true;
  }
}
