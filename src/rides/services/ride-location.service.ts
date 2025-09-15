import { Injectable } from '@nestjs/common';

import { RedisService } from 'src/common/redis.service';
import { WebsocketService } from 'src/realtime/services/websocket.service';

import { ParticipantLocation } from '../interfaces/participant-location.interface';

@Injectable()
export class RideLocationService {
  constructor(
    private readonly redisService: RedisService,
    private readonly wsService: WebsocketService,
  ) {}

  private getRedisKey(rideId: string) {
    return `ride:${rideId}:locations`;
  }

  /** Update participant location */
  async updateLocation(rideId: string, location: ParticipantLocation) {
    const key = this.getRedisKey(rideId);
    await this.redisService.client.hset(
      key,
      location.userId,
      JSON.stringify(location),
    );
    await this.redisService.client.expire(key, 60 * 60 * 24); // TTL: 1 day
    this.wsService.emitToRoom(`ride_${rideId}`, 'LOCATION_UPDATE', location);
  }

  /** Get all participant locations */
  async getAllLocations(rideId: string): Promise<ParticipantLocation[]> {
    const key = this.getRedisKey(rideId);
    const all = await this.redisService.client.hgetall(key);
    const values = Object.values(all);
    const locations = values.map((v) => JSON.parse(v) as ParticipantLocation);
    return locations;
  }

  /** Remove a participant from ride */
  async removeParticipant(rideId: string, userId: string) {
    const key = this.getRedisKey(rideId);
    await this.redisService.client.hdel(key, userId);
    this.wsService.emitToRoom(`ride:${rideId}`, 'PARTICIPANT_LEFT', { userId });
  }

  /** Cleanup all ride locations after completion/cancellation */
  async cleanupRide(rideId: string) {
    const key = this.getRedisKey(rideId);
    await this.redisService.client.del(key);
    this.wsService.emitToRoom(`ride:${rideId}`, 'RIDE_ENDED', { rideId });
  }
}
