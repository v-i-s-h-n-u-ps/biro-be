import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConnectionsModule } from 'src/connections/connections.module';

import { StoriesController } from './controllers/stories.controller';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { StoriesService } from './services/stories.service';
import { StoriesCleanup } from './services/story-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([Story, StoryView]), ConnectionsModule],
  providers: [StoriesService, StoriesCleanup],
  controllers: [StoriesController],
})
export class StoriesModule {}
