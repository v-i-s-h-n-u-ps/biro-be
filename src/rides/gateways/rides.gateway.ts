import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { WsFirebaseAuthGuard } from 'src/auth/guards/ws-firebase-auth.guard';
import { WebsocketService } from 'src/realtime/services/websocket.service';

import { RideLocationService } from '../services/ride-location.service';

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsFirebaseAuthGuard)
export class RideGateway {
  constructor(
    private readonly rideLocationService: RideLocationService,
    private readonly wsService: WebsocketService, // inject central service
  ) {}

  @SubscribeMessage('JOIN_RIDE')
  async handleJoinRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; userId: string },
  ) {
    await client.join(`ride:${data.rideId}`);
    const locations = await this.rideLocationService.getAllLocations(
      data.rideId,
    );

    // send only to this client
    await this.wsService.emitToUser(
      data.userId,
      'CURRENT_LOCATIONS',
      locations,
    );
  }

  @SubscribeMessage('UPDATE_LOCATION')
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

    this.wsService.emitToRoom(`ride:${data.rideId}`, 'LOCATION_UPDATE', data);
  }

  @SubscribeMessage('LEAVE_RIDE')
  async handleLeaveRide(
    @MessageBody() data: { rideId: string; userId: string },
  ) {
    await this.rideLocationService.removeParticipant(data.rideId, data.userId);
  }
}
