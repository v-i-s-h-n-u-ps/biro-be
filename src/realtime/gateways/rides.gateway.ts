import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { WsFirebaseAuthGuard } from 'src/auth/guards/ws-firebase-auth.guard';
import { WebSocketNamespace } from 'src/common/constants/common.enum';
import {
  ClientEvents,
  NotificationEvents,
} from 'src/common/constants/notification-events.enum';
import { type PresenceSocket } from 'src/common/types/socket.types';
import { WebsocketService } from 'src/realtime/services/websocket.service';

import { RideLocationService } from '../../rides/services/ride-location.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: WebSocketNamespace.RIDE,
})
@UseGuards(WsFirebaseAuthGuard)
export class RideGateway {
  constructor(
    private readonly rideLocationService: RideLocationService,
    private readonly wsService: WebsocketService, // inject central service
  ) {}

  @SubscribeMessage(ClientEvents.JOIN_RIDE)
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
      WebSocketNamespace.RIDE,
      userId,
      NotificationEvents.NOTIFICATION_RIDE_CURRENT_LOCATION,
      locations,
    );
  }

  @SubscribeMessage(ClientEvents.UPDATE_LOCATION)
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
      WebSocketNamespace.RIDE,
      `ride:${data.rideId}`,
      NotificationEvents.NOTIFICATION_RIDE_LOCATION_UPDATE,
      data,
    );
  }

  @SubscribeMessage(ClientEvents.LEAVE_RIDE)
  async handleLeaveRide(
    @MessageBody() data: { rideId: string; userId: string },
  ) {
    await this.rideLocationService.removeParticipant(data.rideId, data.userId);
  }
}
