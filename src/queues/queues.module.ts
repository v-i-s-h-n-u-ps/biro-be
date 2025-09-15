import { Module } from '@nestjs/common';

import { RedisService } from 'src/common/redis.service';

import { QueueClientFactory } from './providers/queue-client-factory.provider';

@Module({
  providers: [QueueClientFactory, RedisService],
  exports: [QueueClientFactory],
})
export class QueuesModule {}
