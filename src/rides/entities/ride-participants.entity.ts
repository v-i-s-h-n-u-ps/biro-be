import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ParticipantStatus } from 'src/common/constants/common.enum';
import { ResourceRoles } from 'src/rbac/entities/resource-roles.entity';
import { User } from 'src/users/entities/users.entity';

import { Ride } from './rides.entity';

@Entity('ride_participants')
export class RideParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ride, (ride) => ride.participants, { onDelete: 'CASCADE' })
  ride: Ride;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => ResourceRoles, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: ResourceRoles;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PENDING,
  })
  status: ParticipantStatus;

  @CreateDateColumn({ type: 'time with time zone', name: 'created_at' })
  createdAt: Date;
}
