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

import {
  REALTIME_ACTIVE_ROOM_TTL_SECONDS,
  REDIS_LOCK_TTL_MS,
} from '../constants/realtime.constants';
import { RealtimeQueueService } from '../services/realtime-queue.service';
import { WebsocketService } from '../services/websocket.service';

import { BaseGateway } from './base.gateway';

@WebSocketGateway({ cors: { origin: '*' }, port: 3001 })
export class ChatGateway extends BaseGateway implements OnModuleInit {
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

  @SubscribeMessage(ClientEvents.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const deviceId = client.data.deviceId;
    const userId = client.data.userId;
    const room = `chat:${data.chatId}`;

    if (!userId || !deviceId || !data.chatId?.trim()) {
      client.disconnect();
      return;
    }

    await this.redisService.withLock(
      `user:${userId}:device:${deviceId}`,
      async () => {
        await this.presenceService.updateActiveRoom(
          userId,
          deviceId,
          room,
          REALTIME_ACTIVE_ROOM_TTL_SECONDS,
        );
      },
      REDIS_LOCK_TTL_MS,
    );
    await client.join(room);
  }

  @SubscribeMessage(ClientEvents.LEAVE_CHAT)
  async handleLeaveChat(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const room = `chat:${data.chatId}`;
    const deviceId = client.data.deviceId;
    const userId = client.data.userId;

    await this.redisService.withLock(
      `user:${userId}:device:${deviceId}`,
      async () => {
        await this.presenceService.updateActiveRoom(userId, deviceId, '', 0);
      },
      REDIS_LOCK_TTL_MS,
    );
    await client.leave(room);
  }

  onModuleInit() {
    this.wsService.registerGateway(WebSocketNamespace.CHAT, this.server);
  }

  // @SubscribeMessage('MESSAGE_DELIVERED')
  // async handleMessageDelivered(
  //   @ConnectedSocket() client: PresenceSocket,
  //   @MessageBody() data: { messageId: string; userId: string },
  // ) {
  //   await this.chatService.markAsDelivered(data.messageId, data.userId);
  //   this.wsService.emitToUser(
  //     WebSocketNamespace.CHAT,
  //     data.userId,
  //     'MESSAGE_DELIVERED_CONFIRMATION',
  //     { messageId: data.messageId },
  //   );
  // }
}
