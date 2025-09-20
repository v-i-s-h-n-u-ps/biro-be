import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ObjectLiteral, Repository } from 'typeorm';

import { ResourceRoles } from 'src/authorization/rbac/entities/resource-roles.entity';
import { ResourceType } from 'src/common/constants/common.enum';
import { ResourceRole } from 'src/common/constants/rbac.enum';
import { User } from 'src/users/entities/users.entity';

import {
  RESOURCE_ROLES_KEY,
  ResourceRoleRequirement,
} from '../decorators/resource-roles.decorator';

type ForeignKeyOf<T, V> = {
  [K in keyof Partial<T> & string]: T[K] extends V ? K : never;
}[keyof T & string];

export abstract class ResourceRolesGuard<
  TRelation extends ObjectLiteral,
  TResource extends ObjectLiteral,
> implements CanActivate
{
  protected abstract relationRepo: Repository<TRelation>;
  protected abstract getResourceId(req: Request): string;

  constructor(
    protected readonly reflector: Reflector,
    protected readonly resourceType: ResourceType,
    protected readonly userKey: ForeignKeyOf<TRelation, User>,
    protected readonly resourceKey: ForeignKeyOf<TRelation, TResource>,
    protected readonly resourceRoleKey: ForeignKeyOf<TRelation, ResourceRoles>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allRequirements =
      this.reflector.getAllAndOverride<ResourceRoleRequirement[]>(
        RESOURCE_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    const requirements = allRequirements.filter(
      (r) => r.resource === this.resourceType,
    );

    if (!requirements.length) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!req.user) throw new ForbiddenException('User not authenticated');
    if (req.user.username === 'superuser') return true;

    const userId = req.user.id;
    const resourceId = this.getResourceId(req);
    const alias = this.relationRepo.metadata.name.toLowerCase();

    if (!resourceId) throw new BadRequestException('Invalid resource ID');

    const roleNames = await this.relationRepo
      .createQueryBuilder(alias)
      .innerJoin(`${alias}.${this.resourceRoleKey}`, 'role')
      .innerJoin(`${alias}.${this.resourceKey}`, this.resourceKey)
      .where(`${alias}.${this.userKey}.id = :userId`, { userId })
      .andWhere(`${this.resourceKey}.id = :resourceId`, { resourceId })
      .select('role.id', 'id')
      .distinct(true)
      .getRawMany<{ id: ResourceRole }>()
      .then((rows) => rows.map((r) => r.id));

    if (!roleNames.length)
      throw new ForbiddenException('No role assigned for this resource');

    const hasPermission = requirements.every(({ roles, requireAll }) => {
      return requireAll
        ? roles.every((r) => roleNames.includes(r))
        : roles.some((r) => roleNames.includes(r));
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have enough permissions for ${this.resourceType}`,
      );
    }

    return true;
  }
}
