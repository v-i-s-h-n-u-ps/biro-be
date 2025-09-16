import { UseGuards } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';

import { WsFirebaseAuthGuard } from 'src/auth/guards/ws-firebase-auth.guard';
import { WebSocketNamespace } from 'src/common/constants/common.enum';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  name: WebSocketNamespace.NOTIFICATIONS,
})
@UseGuards(WsFirebaseAuthGuard)
export class NotificationsGateway {
  constructor() {}
}
