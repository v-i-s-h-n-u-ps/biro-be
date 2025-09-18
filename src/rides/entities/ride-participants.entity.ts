import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ResourceRoles } from 'src/authorization/rbac/entities/resource-roles.entity';
import { ParticipantStatus } from 'src/common/constants/common.enum';
import { User } from 'src/users/entities/users.entity';

import { Ride } from './rides.entity';

@Entity('ride_participants')
export class RideParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ride, (ride) => ride.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ride_id' })
  ride: Ride;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  participant: User;

  @ManyToOne(() => ResourceRoles, { eager: true })
  @JoinColumn({ name: 'participant_role_id' })
  participantRole: ResourceRoles;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PENDING,
  })
  status: ParticipantStatus;

  @CreateDateColumn({ type: 'time with time zone', name: 'created_at' })
  createdAt: Date;
}
