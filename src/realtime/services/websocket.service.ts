import { Injectable } from '@nestjs/common';

import { WebsocketGateway } from '../gateways/websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(private readonly websocketGateway: WebsocketGateway) {}

  emitToRoom(room: string, event: string, payload: unknown) {
    this.websocketGateway.broadcastToRoom(room, event, payload);
  }

  async emitToUser(userId: string, event: string, payload: unknown) {
    await this.websocketGateway.broadcastToUser(userId, event, payload);
  }
}
