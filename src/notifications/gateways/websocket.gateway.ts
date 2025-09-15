import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust in production
    methods: ['GET', 'POST'],
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;

  // User joins a room for a room
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomId);
  }

  // User leaves a room for a room
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(roomId);
  }

  // Broadcast message to room
  broadcastToRoom(roomId: string, event: string, payload: unknown) {
    this.server.to(roomId).emit(event, payload);
  }
}
