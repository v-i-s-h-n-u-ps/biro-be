import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RideStatus } from 'src/common/constants/common.enum';
import { User } from 'src/users/entities/users.entity';

import { RideParticipant } from './ride-participants.entity';

@Entity('rides')
@Index('rides_start_point_idx', ['startPoint'], { spatial: true }) // GIST index
@Index('rides_end_point_idx', ['endPoint'], { spatial: true })
@Index('rides_route_idx', ['route'], { spatial: true })
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'boolean', default: true, name: 'is_public' })
  isPublic: boolean;

  @Column({ type: 'timestamp with time zone', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone', name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'start_point',
  })
  startPoint: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'end_point',
  })
  endPoint: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'LineString',
    srid: 4326,
    nullable: true,
  })
  route: string;

  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.UPCOMING })
  status: RideStatus;

  @OneToMany(() => RideParticipant, (p) => p.ride, { cascade: true })
  participants: RideParticipant[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
