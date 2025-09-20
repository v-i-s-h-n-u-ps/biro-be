import { Injectable } from '@nestjs/common';

import { RealtimeJob } from 'src/realtime/interfaces/realtime-job.interface';

import { RealtimeKeys } from './constants/realtime.keys';
import { RedisService } from './redis.service';

@Injectable()
export class PresenceService {
  constructor(private readonly redisService: RedisService) {}

  private getPendingJobValue(userId: string, deviceId: string, jobId: string) {
    return `${userId}|${deviceId}|${jobId}`;
  }

  async addConnection(userId: string, deviceId: string, socketId: string) {
    await this.redisService.client.hset(
      RealtimeKeys.userDevices(userId),
      deviceId,
      socketId,
    );
  }

  async removeConnection(userId: string, deviceId: string) {
    await this.redisService.client.hdel(
      RealtimeKeys.userDevices(userId),
      deviceId,
    );
  }

  async removeConnectionsBatch(
    userDevicePairs: Array<{ userId: string; deviceId: string }>,
  ) {
    const pipeline = this.redisService.client.pipeline();

    userDevicePairs.forEach(({ userId, deviceId }) => {
      pipeline.hdel(RealtimeKeys.userDevices(userId), deviceId);
    });

    await pipeline.exec();
  }

  async getActiveDevices(userId: string): Promise<string[]> {
    // Use HSCAN for large hashes instead of HKEYS
    const devices: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.redisService.client.hscan(
        RealtimeKeys.userDevices(userId),
        cursor,
        'COUNT',
        100,
      );
      cursor = newCursor;
      devices.push(...keys.filter((_, i) => i % 2 === 0)); // keys are at even indices
    } while (cursor !== '0');

    return devices;
  }

  async getSocketForDevice(
    userId: string,
    deviceId: string,
  ): Promise<string | null> {
    return await this.redisService.client.hget(
      RealtimeKeys.userDevices(userId),
      deviceId,
    );
  }

  async getActiveSockets(userId: string): Promise<string[]> {
    const res = await this.redisService.client.hvals(
      RealtimeKeys.userDevices(userId),
    );
    return res ?? [];
  }

  // Pending job storage (per device): jobId -> enqueuedAt (ms)
  async addPendingJob(
    userId: string,
    deviceId: string,
    jobId: string,
    ttlSeconds: number,
  ) {
    await this.redisService.withTransaction((multi) => {
      multi.hset(
        RealtimeKeys.devicePendingHash(userId, deviceId),
        jobId,
        Date.now().toString(),
      );
      multi.expire(
        RealtimeKeys.devicePendingHash(userId, deviceId),
        ttlSeconds,
      );
      // also add to global zset for expiry scanning
      const expiryTs = Date.now() + ttlSeconds * 1000;
      multi.zadd(
        RealtimeKeys.pendingExpiryZset(),
        expiryTs,
        this.getPendingJobValue(userId, deviceId, jobId),
      );
    });
  }

  async removePendingJob(userId: string, deviceId: string, jobId: string) {
    await this.redisService.withTransaction((multi) => {
      multi.hdel(RealtimeKeys.devicePendingHash(userId, deviceId), jobId);
      multi.zrem(
        RealtimeKeys.pendingExpiryZset(),
        this.getPendingJobValue(userId, deviceId, jobId),
      );
    });
  }

  async fetchPendingJobIds(
    userId: string,
    deviceId: string,
  ): Promise<string[]> {
    const res = await this.redisService.client.hkeys(
      RealtimeKeys.devicePendingHash(userId, deviceId),
    );
    return res ?? [];
  }

  // Get expired entries (zset entries with score <= now) - used by sweep worker
  async popExpiredPendingEntries(maxCount = 1000): Promise<string[]> {
    const zkey = RealtimeKeys.pendingExpiryZset();
    const now = Date.now();

    const lua = `
      local items = redis.call('ZRANGEBYSCORE', KEYS[1], 0, ARGV[1], 'LIMIT', 0, ARGV[2])
      for i=1,#items do
        redis.call('ZREM', KEYS[1], items[i])
      end
      return items
    `;
    const result = await this.redisService.client.eval(
      lua,
      1,
      zkey,
      now,
      maxCount,
    );

    return Array.isArray(result) ? (result as string[]) : [];
  }

  async getJob(jobId: string): Promise<RealtimeJob | null> {
    const key = RealtimeKeys.jobKey(jobId);
    const raw = await this.redisService.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as RealtimeJob;
  }

  async storeJob(jobId: string, payload: unknown, ttlSeconds: number) {
    await this.redisService.client.set(
      RealtimeKeys.jobKey(jobId),
      JSON.stringify(payload),
      'EX',
      ttlSeconds,
    );
  }

  async deleteJob(jobId: string) {
    await this.redisService.client.del(RealtimeKeys.jobKey(jobId));
  }

  async dedupSet(jobId: string, deviceId: string, ttlMs: number) {
    // set NX with PX; return true if set (first), false if existed
    const res = await this.redisService.client.set(
      RealtimeKeys.dedupKey(jobId, deviceId),
      '1',
      'PX',
      ttlMs,
      'NX',
    );
    return res === 'OK';
  }

  async dedupMultiSet(
    jobId: string,
    deviceIds: string[],
    ttlMs: number,
  ): Promise<Record<string, boolean>> {
    const multiResults = await this.redisService.withTransaction((multi) => {
      deviceIds.forEach((deviceId) => {
        multi.set(
          RealtimeKeys.dedupKey(jobId, deviceId),
          '1',
          'PX',
          ttlMs,
          'NX',
        );
      });
    });

    // Map results to boolean for each device
    const dedupMap: Record<string, boolean> = {};
    deviceIds.forEach((deviceId, idx) => {
      dedupMap[deviceId] = multiResults[idx] === 'OK';
    });

    return dedupMap;
  }

  async dedupDelete(jobId: string, deviceId?: string) {
    if (deviceId) {
      await this.redisService.client.del(
        RealtimeKeys.dedupKey(jobId, deviceId),
      );
    } else {
      // global dedup for room-only
      await this.redisService.client.del(
        RealtimeKeys.dedupKey(jobId, 'global'),
      );
    }
  }
}
