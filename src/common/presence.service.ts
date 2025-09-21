import { Injectable } from '@nestjs/common';

import { REALTIME_JOB_TTL_SECONDS } from 'src/realtime/constants/realtime.constants';
import { RealtimeJob } from 'src/realtime/interfaces/realtime-job.interface';

import { RealtimeKeys } from './constants/realtime.keys';
import { RedisService } from './redis.service';

@Injectable()
export class PresenceService {
  constructor(private readonly redisService: RedisService) {}

  async addConnection(userId: string, deviceId: string, socketId: string) {
    if (!userId?.trim() || !deviceId?.trim()) {
      throw new Error('Invalid userId or deviceId');
    }
    // Lua for atomic add: set only if not exists or update if different socket
    const lua = `
      local key = KEYS[1]
      local deviceId = ARGV[1]
      local socketId = ARGV[2]
      local existing = redis.call('HGET', key, deviceId)
      if existing ~= socketId then
        redis.call('HSET', key, deviceId, socketId)
        return 1
      end
      return 0
    `;
    const result = await this.redisService.client.eval(
      lua,
      1,
      RealtimeKeys.userDevices(userId),
      deviceId,
      socketId,
    );
    return Number(result) === 1;
  }

  async removeConnection(userId: string, deviceId: string) {
    if (!userId?.trim() || !deviceId?.trim()) return;
    // Lua for atomic remove: del only if exists
    const lua = `
      local key = KEYS[1]
      local deviceId = ARGV[1]
      if redis.call('HEXISTS', key, deviceId) == 1 then
        redis.call('HDEL', key, deviceId)
        return 1
      end
      return 0
    `;
    await this.redisService.client.eval(
      lua,
      1,
      RealtimeKeys.userDevices(userId),
      deviceId,
    );
  }

  async removeConnectionsBatch(
    userDevicePairs: Array<{ userId: string; deviceId: string }>,
  ) {
    const pipeline = this.redisService.client.pipeline();
    userDevicePairs.forEach(({ userId, deviceId }) => {
      if (userId?.trim() && deviceId?.trim()) {
        pipeline.hdel(RealtimeKeys.userDevices(userId), deviceId);
      }
    });
    await pipeline.exec();
  }

  async getActiveDevices(userId: string): Promise<string[]> {
    if (!userId?.trim()) return [];
    // Use HSCAN for large hashes instead of HKEYS
    const devices: string[] = [];
    let cursor = '0';
    const maxDevices = 1000;
    do {
      const [newCursor, keys] = await this.redisService.client.hscan(
        RealtimeKeys.userDevices(userId),
        cursor,
        'COUNT',
        100,
      );
      cursor = newCursor;
      devices.push(...keys.filter((_, i) => i % 2 === 0)); // keys are at even indices
    } while (cursor !== '0' && devices.length < maxDevices);
    return devices;
  }

  async getSocketForDevice(
    userId: string,
    deviceId: string,
  ): Promise<string | null> {
    if (!userId?.trim() || !deviceId?.trim()) return null;
    return await this.redisService.client.hget(
      RealtimeKeys.userDevices(userId),
      deviceId,
    );
  }

  async getActiveSockets(userId: string): Promise<string[]> {
    if (!userId?.trim()) return [];
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
    if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) return;
    // Converted to Lua for atomicity
    const lua = `
      local hashKey = KEYS[1]
      local zsetKey = KEYS[2]
      local jobId = ARGV[1]
      local enqueuedAt = ARGV[2]
      local ttl = ARGV[3]
      local expiryTs = ARGV[4]
      local value = ARGV[5]
      local ok, err = pcall(function()
        redis.call('HSET', hashKey, jobId, enqueuedAt)
        redis.call('EXPIRE', hashKey, ttl)
        redis.call('ZADD', zsetKey, expiryTs, value)
      end)
      if not ok then
        return err
      end
      return "OK"
    `;
    await this.redisService.client.eval(
      lua,
      2,
      RealtimeKeys.devicePendingHash(userId, deviceId),
      RealtimeKeys.pendingExpiryZset(),
      jobId,
      Date.now().toString(),
      ttlSeconds,
      Date.now() + ttlSeconds * 1000,
      RealtimeKeys.pendingJobValue(userId, deviceId, jobId),
    );
    const deviceKey = RealtimeKeys.deviceKey(userId, deviceId);
    await this.redisService.client.sadd(
      RealtimeKeys.pendingMapping(jobId),
      deviceKey,
    );
    await this.redisService.client.expire(
      RealtimeKeys.pendingMapping(jobId),
      REALTIME_JOB_TTL_SECONDS * 1.5,
    );
  }

  async removePendingJob(userId: string, deviceId: string, jobId: string) {
    if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) return;
    // Converted to Lua for atomicity
    const lua = `
      local hashKey = KEYS[1]
      local zsetKey = KEYS[2]
      local jobId = ARGV[1]
      local value = ARGV[2]
      redis.call('HDEL', hashKey, jobId)
      redis.call('ZREM', zsetKey, value)
    `;
    await this.redisService.client.eval(
      lua,
      2,
      RealtimeKeys.devicePendingHash(userId, deviceId),
      RealtimeKeys.pendingExpiryZset(),
      jobId,
      RealtimeKeys.pendingJobValue(userId, deviceId, jobId),
    );
  }

  async fetchPendingJobIds(
    userId: string,
    deviceId: string,
  ): Promise<string[]> {
    if (!userId?.trim() || !deviceId?.trim()) return [];
    const key = RealtimeKeys.devicePendingHash(userId, deviceId);
    const jobs: string[] = [];
    let cursor = '0';
    do {
      const [newCursor, fields] = await this.redisService.client.hscan(
        key,
        cursor,
        'COUNT',
        100,
      );
      cursor = newCursor;
      jobs.push(...fields.filter((_, i) => i % 2 === 0));
    } while (cursor !== '0');
    return jobs;
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

  jobDeviceMapping(jobId: string) {
    const setKey = RealtimeKeys.pendingMapping(jobId);

    return {
      add: async (userId: string, deviceId: string) => {
        const deviceKey = RealtimeKeys.deviceKey(userId, deviceId);
        await this.redisService.withTransaction((multi) => {
          multi.sadd(setKey, deviceKey);
          // Optionally set TTL for cleanup
          multi.expire(setKey, REALTIME_JOB_TTL_SECONDS * 1.5);
        });
      },

      remove: async (userId: string, deviceId: string) => {
        const deviceKey = RealtimeKeys.deviceKey(userId, deviceId);
        return await this.redisService.client.srem(setKey, deviceKey);
      },
    };
  }

  async removePendingJobFully(userId: string, deviceId: string, jobId: string) {
    if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) return;

    const deviceKey = RealtimeKeys.deviceKey(userId, deviceId);
    const hashKey = RealtimeKeys.devicePendingHash(userId, deviceId);
    const zsetKey = RealtimeKeys.pendingExpiryZset();
    const mappingKey = RealtimeKeys.pendingMapping(jobId);
    const jobKey = RealtimeKeys.jobKey(jobId);
    const pendingValue = RealtimeKeys.pendingJobValue(userId, deviceId, jobId);

    const lua = `
      local hashKey = KEYS[1]
      local zsetKey = KEYS[2]
      local mappingKey = KEYS[3]
      local jobKey = KEYS[4]
      local jobId = ARGV[1]
      local device = ARGV[2]
      local pendingValue = ARGV[3]

      -- remove job from per-device hash
      redis.call('HDEL', hashKey, jobId)
      -- remove from expiry ZSET
      redis.call('ZREM', zsetKey, pendingValue)
      -- remove device from mapping set
      redis.call('SREM', mappingKey, device)
      -- if set is empty, delete job key
      if redis.call('SCARD', mappingKey) == 0 then
        redis.call('DEL', jobKey)
      end
      return 1
    `;

    return await this.redisService.client.eval(
      lua,
      4,
      hashKey,
      zsetKey,
      mappingKey,
      jobKey,
      jobId,
      deviceKey,
      pendingValue,
    );
  }

  attemptCount(userId: string, deviceId: string, jobId: string) {
    const hashKey = RealtimeKeys.devicePendingHash(userId, deviceId);

    return {
      get: async (): Promise<{ count: number; timestamp: number } | null> => {
        const attemptData = await this.redisService.client.hget(hashKey, jobId);
        if (!attemptData) return null;
        const [countStr = '0', tsStr = Date.now().toString()] =
          attemptData.split('|');
        return {
          count: parseInt(countStr) || 0,
          timestamp: parseInt(tsStr) || Date.now(),
        };
      },

      set: async (count: number, timestamp?: number) => {
        const ts = timestamp || Date.now();
        await this.redisService.client.hset(hashKey, jobId, `${count}|${ts}`);
        return { count, timestamp: ts };
      },
    };
  }

  async getJob(jobId: string): Promise<RealtimeJob | null> {
    if (!jobId?.trim()) return null;
    const key = RealtimeKeys.jobKey(jobId);
    const raw = await this.redisService.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as RealtimeJob;
  }

  async storeJob(jobId: string, payload: unknown, ttlSeconds: number) {
    if (!jobId?.trim()) return;
    await this.redisService.client.set(
      RealtimeKeys.jobKey(jobId),
      JSON.stringify(payload),
      'EX',
      ttlSeconds,
    );
  }

  async deleteJob(jobId: string) {
    if (!jobId?.trim()) return;
    await this.redisService.client.del(RealtimeKeys.jobKey(jobId));
  }

  async dedupSet(jobId: string, deviceId: string, ttlMs: number) {
    if (!jobId?.trim() || !deviceId?.trim()) return false;
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
    if (!jobId?.trim()) return {};
    deviceIds = deviceIds.filter((id) => id?.trim());
    if (!deviceIds.length) return {};

    // Build Lua: atomic multi SET NX with PX
    const keys: string[] = [];
    deviceIds.forEach((deviceId) => {
      keys.push(RealtimeKeys.dedupKey(jobId, deviceId));
    });
    const lua = `
      local results = {}
      local ttl = tonumber(ARGV[1])
      for i=1,#KEYS do
        local res = redis.call('SET', KEYS[i], '1', 'PX', ttl, 'NX')
        if res then
          table.insert(results, 1)
        else
          table.insert(results, 0)
        end
      end
      return results
    `;

    const result = (await this.redisService.client.eval(
      lua,
      keys.length,
      ...keys,
      ttlMs.toString(),
    )) as number[];

    const dedupMap: Record<string, boolean> = {};
    deviceIds.forEach((deviceId, idx) => {
      dedupMap[deviceId] = result[idx] === 1;
    });

    return dedupMap;
  }

  async dedupDelete(jobId: string, deviceId?: string) {
    if (!jobId?.trim()) return;
    if (deviceId) {
      if (!deviceId?.trim()) return;
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
