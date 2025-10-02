import { Injectable } from '@nestjs/common';

import { WebSocketNamespace } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { WebsocketService } from 'src/realtime/services/websocket.service';

import { ParticipantLocation } from '../interfaces/participant-location.interface';

@Injectable()
export class RideLocationService {
  private readonly TTL_SECONDS = 60 * 60 * 24;

  constructor(
    private readonly redisService: RedisService,
    private readonly wsService: WebsocketService,
    private readonly presenceService: PresenceService,
  ) {}

  private getRedisKey(rideId: string) {
    return `ride:${rideId}:locations`;
  }

  async updateLocation(
    rideId: string,
    location: ParticipantLocation & { deviceId: string },
  ) {
    const key = this.getRedisKey(rideId);
    const field = `${location.userId}:${location.deviceId}`;
    await this.redisService.client.hset(key, field, JSON.stringify(location));
    await this.redisService.client.expire(key, this.TTL_SECONDS);

    this.wsService.emitToRoom(
      WebSocketNamespace.Ride,
      `ride:${rideId}`,
      'LOCATION_UPDATE',
      location,
    );
  }

  async getAllLocations(rideId: string): Promise<ParticipantLocation[]> {
    const key = this.getRedisKey(rideId);
    const all = await this.redisService.client.hgetall(key);
    return Object.values(all).map((v) => JSON.parse(v) as ParticipantLocation);
  }

  async removeParticipant(rideId: string, userId: string, deviceId?: string) {
    const key = this.getRedisKey(rideId);
    if (deviceId) {
      await this.redisService.client.hdel(key, `${userId}:${deviceId}`);
    } else {
      const allFields = await this.redisService.client.hkeys(key);
      const userFields = allFields.filter((f) => f.startsWith(`${userId}:`));
      if (userFields.length)
        await this.redisService.client.hdel(key, ...userFields);
    }

    this.wsService.emitToRoom(
      WebSocketNamespace.Ride,
      `ride:${rideId}`,
      'PARTICIPANT_LEFT',
      {
        userId,
        deviceId,
      },
    );
  }

  async isUserOnline(userId: string) {
    if (!userId?.trim()) return false;
    const devices = await this.presenceService.getActiveDevices(userId);
    return devices.length > 0;
  }

  async cleanupRide(rideId: string) {
    const key = this.getRedisKey(rideId);
    await this.redisService.client.del(key);
    this.wsService.emitToRoom(
      WebSocketNamespace.Ride,
      `ride:${rideId}`,
      'RIDE_ENDED',
      { rideId },
    );
  }
}
