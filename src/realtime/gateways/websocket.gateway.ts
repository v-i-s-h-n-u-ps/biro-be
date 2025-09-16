import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { WsFirebaseAuthGuard } from 'src/auth/guards/ws-firebase-auth.guard';
import { PresenceService } from 'src/common/presence.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
})
@UseGuards(WsFirebaseAuthGuard)
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: PresenceSocket;

  constructor(private readonly presenceService: PresenceService) {}

  private extractUserId(client: Socket): string | null {
    const auth = client.handshake.auth || {};
    const userId =
      typeof auth.userId === 'string' ? auth.userId : String(auth.userId ?? '');
    return userId || null;
  }

  // Handle raw socket connect
  async handleConnection(client: PresenceSocket) {
    const userId = this.extractUserId(client);
    if (!userId) return;

    await this.presenceService.addConnection(
      userId,
      client.data.deviceId || 'unknown-device',
      client.id,
    );
    this.server.emit('USER_ONLINE', { userId });
  }

  // Handle raw socket disconnect
  async handleDisconnect(client: PresenceSocket) {
    const userId = client.data?.userId;
    const deviceId = client.data?.deviceId;

    if (userId && deviceId) {
      await this.presenceService.removeConnection(userId, deviceId);
      this.server.to(`user:${userId}`).emit('USER_OFFLINE', { userId });
    }
  }

  /** User joins presence tracking */
  @SubscribeMessage('PRESENCE_JOIN')
  async handlePresenceJoin(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { userId: string; deviceId: string },
  ) {
    client.data = client.data || {};
    client.data.userId = data.userId;
    client.data.deviceId = data.deviceId;

    await client.join(`user:${data.userId}`);
    await this.presenceService.addConnection(
      data.userId,
      data.deviceId,
      client.id,
    );

    this.server
      .to(`user:${data.userId}`)
      .emit('USER_ONLINE', { userId: data.userId });
  }

  /** Broadcast message to room */
  broadcastToRoom(roomId: string, event: string, payload: unknown) {
    this.server.to(roomId).emit(event, payload);
  }

  /** Broadcast to a user (all devices) */
  async broadcastToUser(userId: string, event: string, payload: unknown) {
    const sockets = await this.presenceService.getActiveSockets(userId);
    sockets.forEach((socketId) =>
      this.server.to(socketId).emit(event, payload),
    );
  }
}
