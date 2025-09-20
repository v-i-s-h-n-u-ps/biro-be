import { Injectable } from '@nestjs/common';

import { WebSocketNamespace } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';

import { AppServerGateway } from '../gateways/app-server.gateway';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly appServerGateway: AppServerGateway,
    private readonly presenceService: PresenceService,
  ) {}

  emitToRoom(
    namespace: WebSocketNamespace,
    room: string,
    event: string,
    payload: unknown,
  ) {
    this.appServerGateway.server
      .of(`/${namespace}`)
      .to(room)
      .emit(event, payload);
  }

  async emitToUser(
    namespace: WebSocketNamespace,
    userId: string,
    event: string,
    payload: unknown,
  ) {
    const sockets = await this.presenceService.getActiveSockets(userId);
    if (sockets.length === 0) return;
    sockets.forEach((socketId) =>
      this.appServerGateway.server
        .of(`/${namespace}`)
        .to(socketId)
        .emit(event, payload),
    );
  }

  emitToSocket(
    namespace: WebSocketNamespace,
    socketId: string,
    event: string,
    payload: unknown,
  ) {
    this.appServerGateway.server
      .of(`/${namespace}`)
      .to(socketId)
      .emit(event, payload);
  }
}
