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
import { Server, Socket } from 'socket.io';

import { WsFirebaseAuthGuard } from 'src/authentication/guards/ws-firebase-auth.guard';
import {
  ClientEvents,
  NotificationEvents,
} from 'src/common/constants/notification-events.enum';
import { PresenceService } from 'src/common/presence.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
})
@UseGuards(WsFirebaseAuthGuard)
export class AppServerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly presenceService: PresenceService) {}

  private extractUserId(client: Socket): string | null {
    const auth = client.handshake.auth || {};
    const userId =
      typeof auth.userId === 'string' ? auth.userId : String(auth.userId ?? '');
    return userId || null;
  }

  async handleConnection(client: PresenceSocket) {
    const userId = this.extractUserId(client);
    if (!userId) return;

    await this.presenceService.addConnection(
      userId,
      client.data.deviceId || 'unknown-device',
      client.id,
    );
    this.server.emit(NotificationEvents.NOTIFICATION_USER_ONLINE, { userId });
  }

  async handleDisconnect(client: PresenceSocket) {
    const userId = client.data?.userId;
    const deviceId = client.data?.deviceId;

    if (userId && deviceId) {
      await this.presenceService.removeConnection(userId, deviceId);
      this.server
        .to(`user:${userId}`)
        .emit(NotificationEvents.NOTIFICATION_USER_OFFLINE, { userId });
    }
  }

  @SubscribeMessage(ClientEvents.PRESENCE_JOIN)
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
      .emit(NotificationEvents.NOTIFICATION_USER_ONLINE, {
        userId: data.userId,
      });
  }
}
