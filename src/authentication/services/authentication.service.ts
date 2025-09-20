import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { FirebaseService } from 'src/firebase/services/firebase.service';
import { User } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async validateAndLogin(idToken: string): Promise<User> {
    try {
      const decoded = await this.firebaseService.verify(idToken);
      const uid = decoded.uid;

      // fetch Firebase user record
      const fbUser = await this.firebaseService.getUser(uid);

      // ✅ if user not in DB, register
      let user = await this.usersService.findByFirebaseUid(uid);
      if (!user) {
        user = await this.usersService.createUser({
          firebaseUid: uid,
          email: fbUser.email ?? undefined,
          phone: fbUser.phoneNumber ?? undefined,
          emailVerified: fbUser.emailVerified,
        });
      }

      await this.usersService.updateLastLogin(user.id);

      return user;
    } catch (err: unknown) {
      throw new UnauthorizedException(
        `Invalid or expired Firebase token: ${(err as Error).message}`,
      );
    }
  }

  async logout(uid: string): Promise<void> {
    try {
      await this.firebaseService.revokeTokens(uid);
    } catch (err: unknown) {
      throw new ForbiddenException(
        `Failed to revoke refresh tokens: ${(err as Error).message}`,
      );
    }
  }

  async createCustomToken(uid: string): Promise<string> {
    return this.firebaseService.createCustomToken(uid);
  }
}
