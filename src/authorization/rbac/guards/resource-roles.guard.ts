import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FindOptionsWhere, Repository } from 'typeorm';

import { RequestWithUser } from 'src/common/types/request-with-user';

import {
  REQUIRE_ALL_RESOURCE_ROLES_KEY,
  RESOURCE_ROLES_KEY,
} from '../decorators/resource-roles.decorator';

@Injectable()
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
    // Get required roles from metadata
    const requiredRoles: string[] =
      this.reflector.get<string[]>(RESOURCE_ROLES_KEY, context.getHandler()) ??
      [];
    const requireAll: boolean =
      this.reflector.get<boolean>(
        REQUIRE_ALL_RESOURCE_ROLES_KEY,
        context.getHandler(),
      ) ?? false;

    // If no roles required, allow access
    if (!requiredRoles.length) return true;

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = req.user.id;
    const resourceId = this.getResourceId(req);

    const userKey = this.getUserKey();
    const resourceKey = this.getResourceKey();

    // Fetch participant with its resource role
    const whereClause: FindOptionsWhere<TParticipant> = {
      [userKey]: { id: userId },
      [resourceKey]: { id: resourceId },
    } as FindOptionsWhere<TParticipant>;

    const participant = await this.participantRepo.findOne({
      where: whereClause,
      relations: ['resourceRole'], // we only need the role itself
    });

    if (!participant) throw new ForbiddenException('Not a participant');

    const participantRole = participant.resourceRole as { name: string };

    // Role check
    const hasRoles = requireAll
      ? requiredRoles.every((r) => participantRole.name === r)
      : requiredRoles.some((r) => participantRole.name === r);

    if (!hasRoles) throw new ForbiddenException('Insufficient role');

    return true;
  }
}
