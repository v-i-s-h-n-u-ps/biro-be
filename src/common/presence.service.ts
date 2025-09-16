import { Injectable } from '@nestjs/common';

import { RedisService } from 'src/common/redis.service';

@Injectable()
export class PresenceService {
  constructor(private readonly redis: RedisService) {}

  // Redis key for storing sockets for a user
  private userKey(userId: string) {
    return `user:${userId}:devices`;
  }

  async addConnection(userId: string, deviceId: string, socketId: string) {
    await this.redis.client.hset(this.userKey(userId), deviceId, socketId);
  }

  async removeConnection(userId: string, deviceId: string) {
    await this.redis.client.hdel(this.userKey(userId), deviceId);
  }

  async isOnline(userId: string): Promise<boolean> {
    const devices = await this.redis.client.hkeys(this.userKey(userId));
    return devices.length > 0;
  }

  async getActiveSockets(userId: string): Promise<string[]> {
    const sockets = await this.redis.client.hvals(this.userKey(userId));
    return sockets;
  }

  async getSocketForDevice(
    userId: string,
    deviceId: string,
  ): Promise<string | null> {
    return await this.redis.client.hget(this.userKey(userId), deviceId);
  }
}
