import { WebSocketGateway } from '@nestjs/websockets';

import { WebSocketNamespace } from 'src/common/constants/common.enum';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  namespace: WebSocketNamespace.NOTIFICATIONS,
})
export class NotificationsGateway {
  constructor() {}
}
