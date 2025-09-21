import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import {
  ClientEvents,
  NotificationEvents,
} from 'src/common/constants/notification-events.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

import { REALTIME_RECONNECT_GRACE_MS } from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';
import { RealtimeQueueService } from '../services/realtime-queue.service';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
})
export class AppServerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(AppServerGateway.name);

  constructor(
    private readonly presenceService: PresenceService,
    private readonly queueService: RealtimeQueueService,
    private readonly redisService: RedisService,
  ) {}

  private extractUserId(client: PresenceSocket): string | null {
    const auth = client.handshake.auth || {};
    const userId =
      typeof auth.userId === 'string' && auth.userId.trim()
        ? auth.userId
        : null;
    if (!userId) {
      client.disconnect();
      return null;
    }
    return userId;
  }

  async handleConnection(client: PresenceSocket) {
    const userId = this.extractUserId(client);
    if (!userId) return;
    const deviceId = ((client.handshake.auth.deviceId as string) || '').trim();
    if (!deviceId) {
      client.disconnect();
      return;
    }
    client.data.deviceId = deviceId;
    await this.redisService.withLock(`user:${userId}:presence`, async () => {
      await this.presenceService.addConnection(userId, deviceId, client.id);
      this.server
        .to(`user:${userId}`)
        .emit(NotificationEvents.NOTIFICATION_USER_ONLINE, { userId });
    });
    client.data['lastConnectionTime'] = Date.now();

    await this.queueService.flushPendingForDevice(
      userId,
      deviceId,
      (job: RealtimeJob, socketId: string) => {
        const {
          data = {},
          wsData = {},
          pushData: _,
          ...notification
        } = job.payload;
        const wsDataFinal = {
          ...data,
          ...wsData,
          ...notification,
          jobId: job.jobId,
        };
        this.server
          .of(`/${job.namespace}`)
          .to(socketId)
          .emit(job.event, wsDataFinal);
      },
    );
  }

  async handleDisconnect(client: PresenceSocket) {
    const userId = client.data?.userId;
    const deviceId = client.data?.deviceId;
    if (!userId?.trim() || !deviceId?.trim()) return;

    const disconnectTime = Date.now();

    const currentSocket = await this.presenceService.getSocketForDevice(
      userId,
      deviceId,
    );
    if (currentSocket && currentSocket !== client.id) return; // Reconnected

    // Apply grace period before marking offline
    if (
      disconnectTime - (client.data['lastConnectionTime'] ?? 0) <
      REALTIME_RECONNECT_GRACE_MS
    ) {
      return;
    }

    await this.redisService.withLock(`user:${userId}:presence`, async () => {
      const currentSocket = await this.presenceService.getSocketForDevice(
        userId,
        deviceId,
      );
      if (currentSocket) return; // Reconnected during grace

      await this.presenceService.removeConnection(userId, deviceId);

      const activeDevices = await this.presenceService.getActiveDevices(userId);
      if (activeDevices.length === 0) {
        this.server
          .to(`user:${userId}`)
          .emit(NotificationEvents.NOTIFICATION_USER_OFFLINE, { userId });
      }
    });
  }

  @SubscribeMessage(ClientEvents.PRESENCE_JOIN)
  async handlePresenceJoin(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { userId: string; deviceId: string },
  ) {
    if (!data.userId?.trim() || !data.deviceId?.trim()) {
      client.disconnect();
      return;
    }
    client.data = client.data || {};
    client.data.userId = data.userId;
    client.data.deviceId = data.deviceId;
    await client.join(`user:${data.userId}`);
    await this.redisService.withLock(
      `user:${data.userId}:presence`,
      async () => {
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
      },
    );
  }

  @SubscribeMessage(ClientEvents.ACKNOWLEDGED)
  async handleAckDelivery(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { jobId: string },
  ) {
    const userId = client.data?.userId;
    const deviceId = client.data?.deviceId;
    const { jobId } = data;
    if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) return;
    await this.queueService.confirmDelivery(jobId, userId, deviceId);
  }
}
