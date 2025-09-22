import { Injectable } from '@nestjs/common';

import { RedisService } from './redis.service';

@Injectable()
export class PresenceService {
  constructor(private readonly redisService: RedisService) {}

  async addConnection(key: string, deviceId: string, socketId: string) {
    if (!key?.trim() || !deviceId?.trim()) {
      throw new Error('Invalid key or deviceId');
    }
    // Lua for atomic add: set only if not exists or update if different socket
    const lua = `
      local key = KEYS[1]
      local deviceId = ARGV[1]
      local socketId = ARGV[2]

      -- Use HSETNX to atomically set only if doesn't exist or is different
      local result = redis.call('HSETNX', key, deviceId, socketId)
      if result == 1 then
        return 1
      end

      -- If exists, check if value is different
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
      key,
      deviceId,
      socketId.trim(),
    );
    return Number(result) === 1;
  }

  async removeConnection(key: string, deviceId: string) {
    if (!key?.trim() || !deviceId?.trim()) return;
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
    await this.redisService.client.eval(lua, 1, key, deviceId);
  }

  async removeConnectionsBatch(
    userDevicePairs: Array<{ userId: string; deviceId: string }>,
  ) {
    const lua = `
      local userKeys = {}
      local deviceMap = {}

      -- Parse input and group by user
      for i = 1, #ARGV do
        local parts = {}
        for part in string.gmatch(ARGV[i], "[^|]+") do
          table.insert(parts, part)
        end
        if #parts == 2 then
          local userId = parts[1]
          local deviceId = parts[2]
          if not userKeys[userId] then
            userKeys[userId] = true
          end
          if not deviceMap[userId] then
            deviceMap[userId] = {}
          end
          table.insert(deviceMap[userId], deviceId)
        end
      end

      local results = {}
      local index = 1

      -- Process each user's devices
      for userId, _ in pairs(userKeys) do
        local key = "presence:user:" .. userId .. ":devices"
        local devices = deviceMap[userId]
        if devices and #devices > 0 then
          redis.call('HDEL', key, unpack(devices))
          results[index] = #devices
          index = index + 1
        end
      end

      return results
    `;
    const args = userDevicePairs.map(
      (pair) => `${pair.userId}|${pair.deviceId}`,
    );
    await this.redisService.client.eval(lua, 0, ...args);
  }

  async getActiveDevices(key: string): Promise<string[]> {
    if (!key?.trim()) return [];
    // Use HSCAN for large hashes instead of HKEYS
    const devices: string[] = [];
    let cursor = '0';
    let keys: string[] = [];
    do {
      const [newCursor, fields] = await this.redisService.client.hscan(
        key,
        cursor,
        'COUNT',
        100,
      );
      keys = [...fields];
      cursor = newCursor;
      devices.push(...keys.filter((_, i) => i % 2 === 0)); // keys are at even indices
    } while (cursor !== '0' && devices.length < 1000 && keys.length > 0); // safety limit
    return devices;
  }

  async getSocketForDevice(
    key: string,
    deviceId: string,
  ): Promise<string | null> {
    if (!key?.trim() || !deviceId?.trim()) return null;
    return await this.redisService.client.hget(key, deviceId);
  }

  async getActiveSockets(key: string): Promise<string[]> {
    if (!key?.trim()) return [];
    const res = await this.redisService.client.hvals(key);
    return res ?? [];
  }
}
