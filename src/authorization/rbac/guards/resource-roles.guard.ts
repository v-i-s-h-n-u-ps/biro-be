import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { ResourceRoles } from 'src/authorization/rbac/entities/resource-roles.entity';
import { ResourceRole } from 'src/common/constants/rbac.enum';

import {
  REQUIRE_ALL_RESOURCE_ROLES_KEY,
  RESOURCE_ROLES_KEY,
} from '../decorators/resource-roles.decorator';

export abstract class ResourceRolesGuard<
  TParticipant extends { [K in TResourceRoleKey]: ResourceRoles },
  TUserKey extends keyof TParticipant & string,
  TResourceKey extends keyof TParticipant & string,
  TResourceRoleKey extends keyof TParticipant & string,
> implements CanActivate
{
  protected abstract participantRepo: Repository<TParticipant>;
  protected abstract getUserKey(): TUserKey;
  protected abstract getResourceKey(): TResourceKey;
  protected abstract getResourceRoleKey(): TResourceRoleKey;
  protected abstract getResourceId(req: Request): string;

  constructor(protected readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.get<ResourceRole[]>(
        RESOURCE_ROLES_KEY,
        context.getHandler(),
      ) ?? [];
    const requireAllRoles =
      this.reflector.get<boolean>(
        REQUIRE_ALL_RESOURCE_ROLES_KEY,
        context.getHandler(),
      ) ?? false;

    if (!requiredRoles.length) return true;

    const req = context.switchToHttp().getRequest<Request>();

    if (!req.user || !req.user.roles) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = req.user.id;
    const resourceId = this.getResourceId(req);
    const resourceRoleKey = this.getResourceRoleKey();
    const resourceKey = this.getResourceKey();
    const userKey = this.getUserKey();

    const participantAlias = 'participant';
    const roleAlias = 'role';
    const permissionAlias = 'permission';
    const resourceAlias = 'resource';

    // Query all participant rows with roles and permissions
    const participants = await this.participantRepo
      .createQueryBuilder(participantAlias)
      // join the role relation
      .innerJoinAndSelect(`${participantAlias}.${resourceRoleKey}`, roleAlias)
      // join role permissions
      .innerJoinAndSelect(`${roleAlias}.permissions`, permissionAlias)
      // join the resource relation for filtering
      .innerJoin(`${participantAlias}.${resourceKey}`, resourceAlias)
      // filter by userId
      .where(`${participantAlias}.${userKey}.id = :userId`, { userId })
      // filter by resourceId
      .andWhere(`${resourceAlias}.id = :resourceId`, { resourceId })
      .getMany();

    if (!participants.length) {
      throw new ForbiddenException('Not a participant');
    }

    // Extract unique ResourceRoles
    const uniqueRolesMap = new Map<string, ResourceRoles>();
    participants.forEach((p) => {
      const role = p[resourceRoleKey];
      uniqueRolesMap.set(role.id, role);
    });
    const userRoles = Array.from(uniqueRolesMap.values());

    // Role check
    const roleNames = userRoles.map((r) => r.name);
    const hasRole = requireAllRoles
      ? requiredRoles.every((r) => roleNames.includes(r))
      : requiredRoles.some((r) => roleNames.includes(r));

    if (!hasRole) {
      throw new ForbiddenException(
        `Required ${requireAllRoles ? 'ALL' : 'ANY'} of roles: [${requiredRoles.join(
          ', ',
        )}]`,
      );
    }

    return true;
  }
}
