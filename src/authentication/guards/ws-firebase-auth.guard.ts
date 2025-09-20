import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { PresenceSocket } from 'src/common/types/socket.types';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class WsFirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsFirebaseAuthGuard.name);

  constructor(
    private readonly userService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<PresenceSocket>(); // Socket
    const token = client.handshake.auth?.token;
    if (!token) return false;

    try {
      const decoded = await this.firebaseService.verify(token);
      const user = await this.userService.findByFirebaseUid(decoded.uid);
      if (!user) throw new UnauthorizedException('User not found');

      client.data.userId = user.id;
      client.data.user = user;
      return true;
    } catch (err) {
      this.logger.error('Firebase auth error:', err);
      return false;
    }
  }
}
