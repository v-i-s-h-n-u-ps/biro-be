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
  protected abstract participantRepo: Repository<TRelation>;
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
    const alias = this.participantRepo.metadata.name.toLowerCase();

    const participants = await this.participantRepo
      // Start building a query on the participant entity, aliasing it dynamically (ex: "rideparticipant")
      .createQueryBuilder(alias)

      // Join the participantRole relation (the ResourceRoles entity) and select it
      // so that each participant includes their assigned role
      .innerJoinAndSelect(`${alias}.${this.resourceRoleKey}`, 'role')

      // Join the ride relation so we can filter by rideId
      // We don’t select the ride because we only need it for filtering
      .innerJoin(`${alias}.${this.resourceKey}`, this.resourceKey)

      // Filter participants by the current user’s id
      // `${alias}.${this.userKey}.id` resolves to something like "rideparticipant.participant.id"
      .where(`${alias}.${this.userKey}.id = :userId`, { userId })

      // Filter participants by the ride id from the request
      // `${this.resourceKey}.id` resolves to "ride.id"
      .andWhere(`${this.resourceKey}.id = :resourceId`, { resourceId })

      // Execute the query and return an array of participants
      .getMany();

    if (!participants.length) {
      throw new ForbiddenException('Not a participant');
    }

    // Extract unique ResourceRoles
    const uniqueRolesMap = new Map<string, ResourceRoles>();
    participants.forEach((p) => {
      const role: ResourceRoles = p[this.resourceRoleKey];
      uniqueRolesMap.set(role.id, role);
    });
    const userRoles = Array.from(uniqueRolesMap.values());

    // Role check
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
