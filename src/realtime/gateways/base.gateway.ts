import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';

import { WebSocketNamespace } from 'src/common/constants/common.enum';
import { NotificationEvents } from 'src/common/constants/notification-events.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

import {
  REALTIME_RECONNECT_GRACE_MS,
  REDIS_LOCK_TTL_MS,
} from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';
import { RealtimeQueueService } from '../services/realtime-queue.service';
import { WebsocketService } from '../services/websocket.service';

export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    protected readonly presenceService: PresenceService,
    protected readonly queueService: RealtimeQueueService,
    protected readonly redisService: RedisService,
    protected readonly wsService: WebsocketService,
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
    await this.redisService.withLock(
      `user:${userId}:presence`,
      async () => {
        await this.presenceService.addConnection(userId, deviceId, client.id);
        await this.wsService.emitToUser(
          WebSocketNamespace.NOTIFICATIONS,
          userId,
          NotificationEvents.NOTIFICATION_USER_ONLINE,
          { userId },
        );
      },
      REDIS_LOCK_TTL_MS,
    );
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
        this.wsService.emitToSocket(
          job.namespace,
          socketId,
          job.event,
          wsDataFinal,
        );
      },
    );
  }

  async handleDisconnect(client: PresenceSocket) {
    const userId = client.data?.userId;
    const deviceId = client.data?.deviceId;
    if (!userId?.trim() || !deviceId?.trim()) return;

    const disconnectTime = Date.now();

    await this.redisService.withLock(
      `user:${userId}:presence`,
      async () => {
        const currentSocket = await this.presenceService.getSocketForDevice(
          userId,
          deviceId,
        );
        if (currentSocket && currentSocket !== client.id) return; // Reconnected

        // Apply grace period before marking offline
        const lastConnectionTime =
          client.data['lastConnectionTime'] ?? disconnectTime;
        if (disconnectTime - lastConnectionTime < REALTIME_RECONNECT_GRACE_MS) {
          return;
        }
        if (currentSocket) return; // Reconnected during grace

        await this.presenceService.removeConnection(userId, deviceId);

        const activeDevices =
          await this.presenceService.getActiveDevices(userId);
        if (activeDevices.length === 0) {
          await this.wsService.emitToUser(
            WebSocketNamespace.NOTIFICATIONS,
            userId,
            NotificationEvents.NOTIFICATION_USER_OFFLINE,
            { userId },
          );
        }
      },
      REDIS_LOCK_TTL_MS,
    );
  }
}
