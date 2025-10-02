import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as IORedis from 'ioredis';
import { createLock, IoredisAdapter, LockHandle } from 'redlock-universal';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);

  client: IORedis.Redis;
  private adapter: IoredisAdapter;
  constructor(private readonly configService: ConfigService) {
    this.client = new IORedis.Redis(
      this.configService.get('REDIS_PORT'),
      this.configService.get('REDIS_HOST'),
      {
        db: this.configService.get('REDIS_DB_INDEX'),
        maxRetriesPerRequest: 3,
      },
    );
    this.adapter = new IoredisAdapter(this.client);
  }

  async onApplicationShutdown() {
    await this.client.quit();
  }

  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttl: number = 5000,
  ): Promise<T | null> {
    const lock = createLock({
      adapter: this.adapter,
      key: resource,
      ttl,
      retryDelay: 200,
      retryAttempts: 10,
    });
    let handle: LockHandle | undefined;
    try {
      handle = await lock.acquire();
      return await fn();
    } catch (error) {
      this.logger.error(`Lock acquisition failed for ${resource}`, error);
      return null;
    } finally {
      if (handle) {
        await lock.release(handle).catch(() => {
          // Silent catch to prevent unhandled errors during release
        });
      }
    }
  }

  async withTransaction<T>(
    callback: (multi: IORedis.ChainableCommander) => unknown,
  ): Promise<T[]> {
    const multi = this.client.multi();
    callback(multi);
    const results = await multi.exec();
    if (!results) return [];
    return results.map(([err, res]) => {
      if (err) throw err;
      return res as T;
    });
  }
}
