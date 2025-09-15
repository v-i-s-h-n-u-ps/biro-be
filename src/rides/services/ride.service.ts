import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ParticipantStatus,
  RideStatus,
} from 'src/common/constants/common.enum';
import { ResourceRole } from 'src/common/constants/rbac.enum';
import { RbacService } from 'src/rbac/services/rbac.service';
import { RealtimeService } from 'src/realtime/services/realtime.service';
import { User } from 'src/users/entities/users.entity';

import { CreateRideDto } from '../dtos/create-ride.dto';
import { UpdateRideDto } from '../dtos/update-ride.dto';
import { RideParticipant } from '../entities/ride-participants.entity';
import { Ride } from '../entities/rides.entity';
import { latLngsToLinestring, latLngToPoint } from '../utils/location.helper';

import { RideLocationService } from './ride-location.service';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(RideParticipant)
    private readonly participantRepo: Repository<RideParticipant>,
    private readonly rbacService: RbacService,
    private readonly rideLocationService: RideLocationService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createRide(owner: User, data: CreateRideDto) {
    const ride = this.rideRepo.create({
      title: data.title,
      owner,
      isPublic: data.isPublic,
      startDate: data.startDate,
      endDate: data.endDate,
      startPoint: latLngToPoint(data.startPoint),
      endPoint: latLngToPoint(data.endPoint),
      route: latLngsToLinestring(data.route ?? []),
      status: data.status,
    });
    await this.rideRepo.save(ride);

    const role = await this.rbacService.getResourceRoles(
      ResourceRole.RIDE_OWNER,
    );
    if (!role)
      throw new NotFoundException('Owner role not found in the system');

    const participant = this.participantRepo.create({
      ride,
      user: owner,
      status: ParticipantStatus.ACCEPTED,
      role: role,
    });
    await this.participantRepo.save(participant);

    return ride;
  }

  async updateRide(rideId: string, data: UpdateRideDto) {
    const ride = await this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['owner'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    Object.assign(ride, data);
    await this.rideRepo.save(ride);
    return ride;
  }

  async joinRide(user: User, rideId: string) {
    const ride = await this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['participants'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const acceptedCount = ride.participants.filter(
      (p) => p.status === ParticipantStatus.ACCEPTED,
    ).length;
    if (acceptedCount >= 100) throw new BadRequestException('Ride is full');

    const status = ride.isPublic
      ? ParticipantStatus.ACCEPTED
      : ParticipantStatus.PENDING;
    const participant = this.participantRepo.create({ ride, user, status });
    await this.participantRepo.save(participant);

    if (status === ParticipantStatus.ACCEPTED) {
      await this.realtimeService.sendNotification({
        userIds: [ride.owner.id],
        title: 'New Participant Joined',
        body: `${user.profile.name} has joined your ride "${ride.title}".`,
        data: { rideId: ride.id, participantId: participant.id },
      });
    } else {
      await this.realtimeService.sendNotification({
        userIds: [ride.owner.id],
        title: 'New Participant Request',
        body: `${user.profile.name} has requested to join your ride "${ride.title}".`,
        data: { rideId: ride.id, participantId: participant.id },
      });
    }

    return participant;
  }

  async acceptParticipant(participantId: string) {
    const participant = await this.participantRepo.findOne({
      where: { id: participantId },
      relations: ['ride', 'user', 'ride.owner'],
    });
    if (!participant) throw new NotFoundException('Participant not found');

    participant.status = ParticipantStatus.ACCEPTED;
    await this.participantRepo.save(participant);

    await this.realtimeService.sendNotification({
      userIds: [participant.user.id],
      title: 'Ride Participation Accepted',
      body: `Your request to join the ride "${participant.ride.title}" has been accepted.`,
      data: { rideId: participant.ride.id, participantId: participant.id },
    });

    return participant;
  }

  async cancelOrCompleteRide(rideId: string, status: RideStatus) {
    const ride = await this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['owner'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    ride.status = status;
    await this.rideRepo.save(ride);

    await this.rideLocationService.cleanupRide(ride.id); // remove Redis locations
    return ride;
  }
}
