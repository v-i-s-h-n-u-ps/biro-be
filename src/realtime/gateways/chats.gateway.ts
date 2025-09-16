import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { WsFirebaseAuthGuard } from 'src/auth/guards/ws-firebase-auth.guard';
import { WebSocketNamespace } from 'src/common/constants/common.enum';
import { ClientEvents } from 'src/common/constants/notification-events.enum';
import { type PresenceSocket } from 'src/common/types/socket.types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: WebSocketNamespace.CHAT,
})
@UseGuards(WsFirebaseAuthGuard)
export class ChatGateway {
  constructor() {}

  @SubscribeMessage(ClientEvents.JOIN_CHAT)
  async handleJoinChat(
    @ConnectedSocket() client: PresenceSocket,
    @MessageBody() data: { chatId: string; userId: string },
  ) {
    // Join chat-specific room
    await client.join(`chat:${data.chatId}`);
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
