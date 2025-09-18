import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { type Request } from 'express';
import { Repository } from 'typeorm';

import { ResourceRolesGuard } from 'src/authorization/rbac/guards/resource-roles.guard';

import { RideParticipant } from '../entities/ride-participants.entity';

@Injectable()
export class RidesRolesGuard extends ResourceRolesGuard<RideParticipant> {
  constructor(
    reflector: Reflector,
    @InjectRepository(RideParticipant)
    protected readonly relationRepo: Repository<RideParticipant>,
  ) {
    super(reflector, 'participant', 'ride', 'participantRole');
  }

  protected getResourceId(req: Request): string {
    return req.params.rideId;
  }
}
