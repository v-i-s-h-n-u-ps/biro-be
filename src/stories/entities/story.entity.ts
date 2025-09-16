import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/users/entities/users.entity';

import { StoryView } from './story-view.entity';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('text')
  media: string;

  @Column({ type: 'timestamp with time zone', name: 'expires_at' })
  expiresAt: Date;

  @OneToMany(() => StoryView, (view) => view.story, { cascade: true })
  views: StoryView[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
