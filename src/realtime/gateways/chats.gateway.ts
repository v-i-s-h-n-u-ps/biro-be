import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { WebSocketNamespace } from 'src/common/constants/common.enum';
import { ClientEvents } from 'src/common/constants/notification-events.enum';
import { PresenceService } from 'src/common/presence.service';
import { type PresenceSocket } from 'src/common/types/socket.types';

import { REALTIME_ACTIVE_ROOM_TTL_SECONDS } from '../constants/realtime.constants';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: WebSocketNamespace.CHAT,
})
export class ChatGateway {
  constructor(private readonly presenceService: PresenceService) {}

  @SubscribeMessage(ClientEvents.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { chatId: string },
  ) {
    // Join chat-specific room
    if (!data.chatId?.trim()) {
      client.disconnect();
      return;
    }
    const deviceId = client.data.deviceId;
    const userId = client.data.userId;
    if (!userId || !deviceId) {
      client.disconnect();
      return;
    }

    const room = `chat:${data.chatId}`;
    await this.presenceService.updateActiveRoom(
      userId,
      deviceId,
      room,
      REALTIME_ACTIVE_ROOM_TTL_SECONDS * 1000,
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
    await this.presenceService.updateActiveRoom(userId, deviceId, '', 0);

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
