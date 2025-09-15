import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FindOptionsWhere, Repository } from 'typeorm';

import { RequestWithUser } from 'src/common/types/request-with-user';

export abstract class ResourceRolesGuard<
  TParticipant extends Record<string, unknown>,
  TUserKey extends keyof TParticipant,
  TResourceKey extends keyof TParticipant,
> implements CanActivate
{
  protected abstract participantRepo: Repository<TParticipant>;
  protected abstract getUserKey(): TUserKey;
  protected abstract getResourceKey(): TResourceKey;
  protected abstract getResourceId(req: RequestWithUser): string;

  constructor(protected readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles: string[] =
      this.reflector.get<string[]>('roles', context.getHandler()) ?? [];
    const requiredPermissions: string[] =
      this.reflector.get<string[]>('permissions', context.getHandler()) ?? [];
    const requireAllRoles: boolean =
      this.reflector.get<boolean>('requireAllRoles', context.getHandler()) ??
      false;
    const requireAllPermissions: boolean =
      this.reflector.get<boolean>(
        'requireAllPermissions',
        context.getHandler(),
      ) ?? false;

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = req.user.id;
    const resourceId = this.getResourceId(req);

    const userKey = this.getUserKey();
    const resourceKey = this.getResourceKey();

    // Dynamically construct the TypeORM where clause
    const whereClause: FindOptionsWhere<TParticipant> = {
      [userKey]: { id: userId },
      [resourceKey]: { id: resourceId },
    } as FindOptionsWhere<TParticipant>;

    const participant = await this.participantRepo.findOne({
      where: whereClause,
      relations: ['resourceRole', 'resourceRole.permissions'],
    });

    if (!participant) throw new ForbiddenException('Not a participant');

    const participantRole = participant.resourceRole as {
      name: string;
      permissions: { id: string }[];
    };

    // Role check
    if (requiredRoles.length) {
      const hasRoles = requiredRoles.map((r) =>
        participantRole.name.includes(r),
      );
      if (
        requireAllRoles ? !hasRoles.every(Boolean) : !hasRoles.some(Boolean)
      ) {
        throw new ForbiddenException('Insufficient role');
      }
    }

    // Permission check
    if (requiredPermissions.length) {
      const hasPermissions = requiredPermissions.map((p) =>
        participantRole.permissions.some((per) => per.id === p),
      );
      if (
        requireAllPermissions
          ? !hasPermissions.every(Boolean)
          : !hasPermissions.some(Boolean)
      ) {
        throw new ForbiddenException('Permission denied');
      }
    }

    return true;
  }
}
