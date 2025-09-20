import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

import { PresenceSocket } from 'src/common/types/socket.types';

@Injectable()
export class WsFirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsFirebaseAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<PresenceSocket>(); // Socket
    const token = client.handshake.auth?.token;
    if (!token) return false;

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      client.data.userId = decoded.uid;
      return true;
    } catch (err) {
      this.logger.error('Firebase auth error:', err);
      return false;
    }
  }
}
