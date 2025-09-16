import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from 'src/common/redis.service';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { WebsocketService } from 'src/realtime/services/websocket.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { ParticipantLocation } from '../interfaces/participant-location.interface';

@Injectable()
export class RideLocationService {
  private readonly logger = new Logger(RideLocationService.name);
  private readonly TTL_SECONDS = 60 * 60 * 24; // 1 day

  constructor(
    private readonly redisService: RedisService,
    private readonly wsService: WebsocketService,
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
  ) {}

  private getRedisKey(rideId: string) {
    return `ride:${rideId}:locations`;
  }

  /** Update participant location for a specific device */
  async updateLocation(
    rideId: string,
    location: ParticipantLocation & { deviceId: string },
  ) {
    const key = this.getRedisKey(rideId);
    const field = `${location.userId}:${location.deviceId}`;
    await this.redisService.client.hset(key, field, JSON.stringify(location));
    await this.redisService.client.expire(key, this.TTL_SECONDS);

    this.wsService.emitToRoom(`ride:${rideId}`, 'LOCATION_UPDATE', location);

    // Optional: check offline users and send push if needed
    const isOnline = await this.isUserOnline(location.userId);
    if (!isOnline) {
      const devices = await this.userDeviceService.getDevicesByUserIds([
        location.userId,
      ]);
      const tokens = devices.map((d) => d.deviceToken).filter(Boolean);
      if (tokens.length) {
        await this.firebaseService.sendNotificationToDevices(tokens, {
          notification: {
            title: 'Ride Update',
            body: 'Your location update failed to reach peers in real-time.',
          },
          data: {
            rideId,
            lat: location.lat.toString(),
            lng: location.lng.toString(),
          },
        });
      }
    }
  }

  /** Get all participant locations */
  async getAllLocations(rideId: string): Promise<ParticipantLocation[]> {
    const key = this.getRedisKey(rideId);
    const all = await this.redisService.client.hgetall(key);
    return Object.values(all).map((v) => JSON.parse(v) as ParticipantLocation);
  }

  /** Remove participant (specific device or all devices) */
  async removeParticipant(rideId: string, userId: string, deviceId?: string) {
    const key = this.getRedisKey(rideId);
    if (deviceId) {
      await this.redisService.client.hdel(key, `${userId}:${deviceId}`);
    } else {
      // remove all devices for this user
      const allFields = await this.redisService.client.hkeys(key);
      const userFields = allFields.filter((f) => f.startsWith(`${userId}:`));
      if (userFields.length)
        await this.redisService.client.hdel(key, ...userFields);
    }
    this.wsService.emitToRoom(`ride:${rideId}`, 'PARTICIPANT_LEFT', {
      userId,
      deviceId,
    });
  }

  /** Check if a user is online (any device) */
  async isUserOnline(userId: string) {
    const keys = await this.redisService.client.keys(`user:${userId}:*`);
    return keys.length > 0;
  }

  /** Cleanup all ride locations (ride ended or cancelled) */
  async cleanupRide(rideId: string) {
    const key = this.getRedisKey(rideId);
    await this.redisService.client.del(key);
    this.wsService.emitToRoom(`ride:${rideId}`, 'RIDE_ENDED', { rideId });
  }
}
