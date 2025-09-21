import { Injectable } from '@nestjs/common';

import { RealtimeKeys } from 'src/common/constants/realtime.keys';
import { RedisService } from 'src/common/redis.service';

import { REALTIME_JOB_TTL_SECONDS } from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';

@Injectable()
export class RealtimeStoreService {
  constructor(private readonly redisService: RedisService) {}

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
    await this.jobDeviceMapping(jobId).add(userId, deviceId);
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
          // Keep mapping for longer than job itself to prevent early deletion
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

  manageJob(jobId: string) {
    if (!jobId?.trim()) return;
    const key = RealtimeKeys.jobKey(jobId);

    return {
      get: async (): Promise<RealtimeJob | null> => {
        const raw = await this.redisService.client.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as RealtimeJob;
      },
      set: async (payload: RealtimeJob, ttlSeconds: number) => {
        return await this.redisService.client.set(
          RealtimeKeys.jobKey(jobId),
          JSON.stringify(payload),
          'EX',
          ttlSeconds,
        );
      },
      delete: async () => {
        return await this.redisService.client.del(RealtimeKeys.jobKey(jobId));
      },
    };
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

  async filterMutedUsers(userIds: string[], type?: string) {
    if (!type) return userIds.filter((id) => id?.trim());
    const results = await Promise.all(
      userIds.map(async (uid) => {
        if (!uid?.trim()) return null;
        const isMuted = await this.redisService.client.sismember(
          RealtimeKeys.mutedNotifications(uid),
          type,
        );
        return isMuted ? null : uid;
      }),
    );
    return results.filter((id): id is string => !!id);
  }

  async muteNotification(userId: string, type: string, until?: Date) {
    if (!userId?.trim() || !type?.trim()) return;
    const key = RealtimeKeys.mutedNotifications(userId);
    await this.redisService.withTransaction((multi) => {
      multi.sadd(key, type);
      if (until) {
        const ttl = Math.ceil((until.getTime() - Date.now()) / 1000);
        if (ttl > 0) multi.expire(key, ttl);
      }
    });
  }

  async unmuteNotification(userId: string, type: string) {
    if (!userId?.trim() || !type?.trim()) return;
    const key = RealtimeKeys.mutedNotifications(userId);
    await this.redisService.client.srem(key, type);
  }
}
