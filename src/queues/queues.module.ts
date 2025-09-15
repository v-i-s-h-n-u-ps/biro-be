import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { RedisService } from 'src/common/redis.service';

import { QueueClientFactory } from './providers/queue-client-factory.provider';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [QueuesModule],
      useFactory: (factory: QueueClientFactory): BullModuleOptions => ({
        prefix: 'QUEUE',
        createClient: (_type, options) =>
          factory.build({
            ...options,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          }),
      }),
      inject: [QueueClientFactory],
    }),
  ],
  providers: [QueueClientFactory, RedisService],
  exports: [QueueClientFactory],
})
export class QueuesModule {}
