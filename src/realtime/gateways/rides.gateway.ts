import { OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { WebSocketNamespace } from 'src/common/constants/common.enum';
import {
  ClientEvents,
  NotificationEvents,
} from 'src/common/constants/notification-events.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { type PresenceSocket } from 'src/common/types/socket.types';
import { WebsocketService } from 'src/realtime/services/websocket.service';

import { RideLocationService } from '../../rides/services/ride-location.service';
import { RealtimeQueueService } from '../services/realtime-queue.service';

import { BaseGateway } from './base.gateway';

@WebSocketGateway({ cors: { origin: '*' }, port: 3003 })
export class RideGateway extends BaseGateway implements OnModuleInit {
  constructor(
    presenceService: PresenceService,
    queueService: RealtimeQueueService,
    redisService: RedisService,
    wsService: WebsocketService, // inject central service
    private readonly rideLocationService: RideLocationService,
  ) {
    super(presenceService, queueService, redisService, wsService);
  }

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.wsService.registerGateway(WebSocketNamespace.Ride, this.server);
  }

  @SubscribeMessage(ClientEvents.JoinRide)
  async handleJoinRide(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { rideId: string },
  ) {
    const userId = client.data?.userId ?? '';
    await client.join(`ride:${data.rideId}`);
    const locations = await this.rideLocationService.getAllLocations(
      data.rideId,
    );

    // send only to this client
    await this.wsService.emitToUser(
      WebSocketNamespace.Ride,
      userId,
      NotificationEvents.NotificationRideCurrentLocation,
      locations,
    );
  }

  @SubscribeMessage(ClientEvents.UpdateLocation)
  async handleUpdateLocation(
    @MessageBody()
    data: {
      rideId: string;
      userId: string;
      deviceId: string;
      lat: number;
      lng: number;
    },
  ) {
    await this.rideLocationService.updateLocation(data.rideId, {
      ...data,
      updatedAt: Date.now(),
    });

    this.wsService.emitToRoom(
      WebSocketNamespace.Ride,
      `ride:${data.rideId}`,
      NotificationEvents.NotificationRideLocationUpdate,
      data,
    );
  }

  @SubscribeMessage(ClientEvents.LeaveRide)
  async handleLeaveRide(
    @MessageBody() data: { rideId: string; userId: string },
  ) {
    await this.rideLocationService.removeParticipant(data.rideId, data.userId);
  }
}
