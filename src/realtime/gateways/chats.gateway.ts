import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { WebSocketNamespace } from 'src/common/constants/common.enum';
import { ClientEvents } from 'src/common/constants/notification-events.enum';
import { RealtimeKeys } from 'src/common/constants/realtime.keys';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

import { REALTIME_RECONNECT_GRACE_MS } from '../constants/realtime.constants';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: WebSocketNamespace.CHAT,
})
export class ChatGateway {
  constructor(
    private readonly redisService: RedisService,
    private readonly presenceService: PresenceService,
    // private readonly chatService: ChatService,
  ) {}

  @SubscribeMessage(ClientEvents.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { chatId: string },
  ) {
    // Join chat-specific room
    const deviceId = client.data?.deviceId;
    if (!data.chatId?.trim() || !deviceId?.trim()) {
      client.disconnect();
      return;
    }
    const room = `chat:${data.chatId}`;
    const key = RealtimeKeys.roomDevices(data.chatId);
    await this.redisService.withLock(key, async () => {
      await this.presenceService.addConnection(key, deviceId, client.id);
    });
    await client.join(room);
  }

  @SubscribeMessage(ClientEvents.LEAVE_CHAT)
  async handleLeaveChat(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const deviceId = client.data?.deviceId;

    const room = `chat:${data.chatId}`;

    const disconnectTime = Date.now();

    const key = RealtimeKeys.roomDevices(data.chatId);
    const currentSocket = await this.presenceService.getSocketForDevice(
      key,
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

    await this.redisService.withLock(key, async () => {
      const currentSocket = await this.presenceService.getSocketForDevice(
        key,
        deviceId,
      );
      if (currentSocket) return; // Reconnected during grace
      await this.presenceService.removeConnection(key, deviceId);
    });
    await client.leave(room);
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
