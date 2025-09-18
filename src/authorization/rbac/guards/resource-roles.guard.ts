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
import { User } from 'src/users/entities/users.entity';

import {
  REQUIRE_ALL_RESOURCE_ROLES_KEY,
  RESOURCE_ROLES_KEY,
} from '../decorators/resource-roles.decorator';

type ResourceRoleKeyOf<T> = {
  [K in keyof T]: T[K] extends ResourceRoles ? K : never;
}[keyof T];

type UserKeyOf<T> = {
  [K in keyof T]: T[K] extends User ? K : never;
}[keyof T];

export abstract class ResourceRolesGuard<
  TRelation extends {
    [K in ResourceRoleKeyOf<TRelation>]: ResourceRoles;
  },
> implements CanActivate
{
  protected abstract relationRepo: Repository<TRelation>;
  protected abstract getResourceId(req: Request): string;

  constructor(
    protected readonly reflector: Reflector,
    protected readonly userKey: UserKeyOf<TRelation> & string,
    protected readonly resourceKey: keyof TRelation & string,
    protected readonly resourceRoleKey: ResourceRoleKeyOf<TRelation> & string,
  ) {}

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
    const alias = this.relationRepo.metadata.name.toLowerCase();

    const userRoleMap = await this.relationRepo
      .createQueryBuilder(alias)
      .innerJoinAndSelect(`${alias}.${this.resourceRoleKey}`, 'role')
      .innerJoin(`${alias}.${this.resourceKey}`, this.resourceKey)
      .where(`${alias}.${this.userKey}.id = :userId`, { userId })
      .andWhere(`${this.resourceKey}.id = :resourceId`, { resourceId })
      .getMany();

    if (!userRoleMap.length) {
      throw new ForbiddenException('Not a participant');
    }

    const uniqueRolesMap = new Map<string, ResourceRoles>();
    userRoleMap.forEach((p) => {
      const role: ResourceRoles = p[this.resourceRoleKey];
      uniqueRolesMap.set(role.id, role);
    });

    const userRoles = Array.from(uniqueRolesMap.values());
    const roleNames = userRoles.map((r) => r.id);
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
