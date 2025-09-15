import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as IORedis from 'ioredis';

import { RedisService } from 'src/common/redis.service';

@Injectable()
export class QueueClientFactory implements OnApplicationShutdown {
  private clients: IORedis.Redis[] = [];

  constructor(private readonly redisService: RedisService) {
    this.clients = [];
  }

  build(options?: IORedis.RedisOptions): IORedis.Redis {
    const client = this.redisService.client.duplicate(options);
    this.clients.push(client);

    return client;
  }

  async onApplicationShutdown() {
    await Promise.all(
      this.clients.map((c) =>
        c.status !== 'end' ? c.quit() : Promise.resolve(),
      ),
    );
  }
}
