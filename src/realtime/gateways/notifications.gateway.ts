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
import { ClientEvents } from 'src/common/constants/notification-events.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

import { RealtimeQueueService } from '../services/realtime-queue.service';
import { WebsocketService } from '../services/websocket.service';

import { BaseGateway } from './base.gateway';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'], port: 3002 },
  namespace: WebSocketNamespace.NOTIFICATIONS,
})
export class NotificationsGateway extends BaseGateway implements OnModuleInit {
  constructor(
    presenceService: PresenceService,
    queueService: RealtimeQueueService,
    redisService: RedisService,
    wsService: WebsocketService,
  ) {
    super(presenceService, queueService, redisService, wsService);
  }

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.wsService.registerGateway(
      WebSocketNamespace.NOTIFICATIONS,
      this.server,
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
