import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './users.entity';

@Entity('user_devices')
@Unique(['deviceToken'])
@Index(['user', 'isActive'])
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_token', type: 'varchar', length: 512 })
  deviceToken: string;

  @Column({ name: 'device_id', type: 'varchar', length: 256, nullable: true })
  deviceId: string;

  @Column({ name: 'platform', type: 'enum', enum: ['ios', 'android', 'web'] })
  platform: 'ios' | 'android' | 'web';

  @Column({ name: 'os_name', type: 'varchar', length: 50, nullable: true })
  osName?: string;

  @Column({ name: 'os_version', type: 'varchar', length: 50, nullable: true })
  osVersion: string;

  @Column({ nullable: true, name: 'app_version', type: 'varchar', length: 50 })
  appVersion: string;

  @Column({ name: 'model', type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({
    name: 'manufacturer',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  manufacturer: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_emulator', type: 'boolean', default: false })
  isEmulator: boolean;

  @Column({ name: 'notifications_enabled', type: 'boolean', default: true })
  notificationsEnabled: boolean;

  @Column({ name: 'notifications_importance', type: 'int', nullable: true })
  notificationsImportance?: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
