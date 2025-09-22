import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

import { WebSocketNamespace } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';

@Injectable()
export class WebsocketService {
  private readonly gateways: Partial<Record<WebSocketNamespace, Server>> = {};

  constructor(private readonly presenceService: PresenceService) {}

  registerGateway(namespace: WebSocketNamespace, gateway: Server) {
    this.gateways[namespace] = gateway;
  }

  emitToRoom(
    namespace: WebSocketNamespace,
    room: string,
    event: string,
    payload: unknown,
  ) {
    this.gateways[namespace].to(room).emit(event, payload);
  }

  async emitToUser(
    namespace: WebSocketNamespace,
    userId: string,
    event: string,
    payload: unknown,
  ) {
    if (!userId?.trim()) return;
    const sockets = await this.presenceService.getActiveSockets(userId);
    if (sockets.length === 0) return;
    sockets.forEach((socketId) =>
      this.emitToSocket(namespace, socketId, event, payload),
    );
  }

  emitToSocket(
    namespace: WebSocketNamespace,
    socketId: string,
    event: string,
    payload: unknown,
  ) {
    if (!socketId?.trim()) return;
    this.gateways[namespace].to(socketId).emit(event, payload);
  }
}
