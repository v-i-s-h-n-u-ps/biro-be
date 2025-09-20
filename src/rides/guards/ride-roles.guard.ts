import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { type Request } from 'express';
import { Repository } from 'typeorm';

import { ResourceRolesGuard } from 'src/authorization/rbac/guards/resource-roles.guard';
import { ResourceType } from 'src/common/constants/common.enum';

import { RideParticipant } from '../entities/ride-participants.entity';
import { Ride } from '../entities/rides.entity';

@Injectable()
export class RideRolesGuard extends ResourceRolesGuard<RideParticipant, Ride> {
  constructor(
    reflector: Reflector,
    @InjectRepository(RideParticipant)
    protected readonly relationRepo: Repository<RideParticipant>,
    protected readonly resourceType = ResourceType.RIDE,
  ) {
    super(reflector, 'participant', 'ride', 'participantRole');
  }

  protected getResourceId(req: Request): string {
    return req.params.rideId;
  }
}
