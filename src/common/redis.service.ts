import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as IORedis from 'ioredis';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  client: IORedis.Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new IORedis.Redis(
      this.configService.get('REDIS_PORT'),
      this.configService.get('REDIS_HOST'),
      {
        db: this.configService.get('REDIS_DB_INDEX'),
        maxRetriesPerRequest: 1,
      },
    );
  }

  async onApplicationShutdown() {
    await this.client.quit();
  }

  async withTransaction(
    callback: (pipeline: IORedis.ChainableCommander) => unknown,
  ) {
    const pipeline = this.client.multi();
    callback(pipeline);
    await pipeline.exec();
  }
}
