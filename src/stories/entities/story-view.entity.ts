import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/users/entities/users.entity';

import { Story } from './story.entity';

@Entity()
export class StoryView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Story, (story) => story.views, { onDelete: 'CASCADE' })
  story: Story;

  @ManyToOne(() => User, { eager: true })
  viewer: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
