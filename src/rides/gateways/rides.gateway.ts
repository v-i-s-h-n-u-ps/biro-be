import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { RideLocationService } from '../services/ride-location.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class RideGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly rideLocationService: RideLocationService) {}

  /** Join a ride room */
  @SubscribeMessage('JOIN_RIDE')
  async handleJoinRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideId: string; userId: string },
  ) {
    client.join(`ride:${data.rideId}`);
    const locations = await this.rideLocationService.getAllLocations(
      data.rideId,
    );
    client.emit('CURRENT_LOCATIONS', locations);
  }

  /** Update participant location */
  @SubscribeMessage('UPDATE_LOCATION')
  async handleUpdateLocation(
    @MessageBody()
    data: {
      rideId: string;
      userId: string;
      lat: number;
      lng: number;
    },
  ) {
    await this.rideLocationService.updateLocation(data.rideId, {
      ...data,
      updatedAt: Date.now(),
    });
  }

  /** Leave ride */
  @SubscribeMessage('LEAVE_RIDE')
  async handleLeaveRide(
    @MessageBody() data: { rideId: string; userId: string },
  ) {
    await this.rideLocationService.removeParticipant(data.rideId, data.userId);
  }
}
