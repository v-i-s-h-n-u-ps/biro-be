import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { StoriesService } from './stories.service';

@Injectable()
export class StoriesCleanup {
  constructor(private readonly storiesService: StoriesService) {}

  @Cron('0 * * * *') // every hour
  async cleanupExpired() {
    await this.storiesService.deleteExpiredStories();
  }
}
