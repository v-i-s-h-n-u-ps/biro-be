import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { type Request } from 'express';
import { Repository } from 'typeorm';

import { ResourceRolesGuard } from 'src/authorization/rbac/guards/resource-roles.guard';

import { RideParticipant } from '../entities/ride-participants.entity';

@Injectable()
export class RideRolesGuard extends ResourceRolesGuard<
  RideParticipant,
  'user',
  'ride',
  'role'
> {
  constructor(
    reflector: Reflector,
    @InjectRepository(RideParticipant)
    protected readonly participantRepo: Repository<RideParticipant>,
  ) {
    super(reflector);
  }

  protected getUserKey(): 'user' {
    return 'user';
  }

  protected getResourceKey(): 'ride' {
    return 'ride';
  }

  protected getResourceRoleKey(): 'role' {
    return 'role';
  }

  protected getResourceId(req: Request): string {
    return req.params.rideId;
  }
}
