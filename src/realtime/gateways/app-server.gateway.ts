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

import {
  ClientEvents,
  NotificationEvents,
} from 'src/common/constants/notification-events.enum';
import { PresenceService } from 'src/common/presence.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

import { RealtimeQueueService } from '../services/realtime-queue.service';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
})
export class AppServerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presenceService: PresenceService,
    private readonly queueService: RealtimeQueueService,
  ) {}

  private extractUserId(client: Socket): string | null {
    const auth = client.handshake.auth || {};
    const userId =
      typeof auth.userId === 'string' ? auth.userId : String(auth.userId ?? '');
    return userId || null;
  }

  async handleConnection(client: PresenceSocket) {
    const userId = this.extractUserId(client);
    if (!userId) return;

    const deviceId = client.data.deviceId || 'unknown-device';
    await this.presenceService.addConnection(userId, deviceId, client.id);
    this.server
      .to(`user:${userId}`)
      .emit(NotificationEvents.NOTIFICATION_USER_ONLINE, { userId });

    await this.queueService.flushPendingForDevice(
      userId,
      client.data.deviceId,
      ({ payload, namespace, event }) => {
        const {
          data = {},
          wsData = {},
          pushData: _,
          ...notification
        } = payload;
        const wsDataFinal = { ...data, ...wsData, ...notification };
        this.server.of(`/${namespace}`).to(client.id).emit(event, wsDataFinal);
      },
    );
  }

  async handleDisconnect(client: PresenceSocket) {
    const userId = client.data?.userId;
    const deviceId = client.data?.deviceId;

    if (userId && deviceId) {
      await this.presenceService.removeConnection(userId, deviceId);

      // Only emit offline if no devices remain
      const activeDevices = await this.presenceService.getActiveDevices(userId);
      if (activeDevices.length === 0) {
        this.server
          .to(`user:${userId}`)
          .emit(NotificationEvents.NOTIFICATION_USER_OFFLINE, { userId });
      }
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
