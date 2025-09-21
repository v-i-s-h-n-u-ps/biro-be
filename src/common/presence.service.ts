import { Injectable } from '@nestjs/common';

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
}
