import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { FirebaseService } from 'src/firebase/services/firebase.service';
import { User } from 'src/users/entities/users.entity';
import { UserDeviceService } from 'src/users/services/user-devices.service';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly userDeviceService: UserDeviceService,
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

      // // ✅ if device info present, register device for push notifications
      // await this.userDeviceService.registerDevice(
      //   user.id,
      //   deviceToken,
      //   deviceType,
      // );

      // ✅ update last login
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
      const user = await this.usersService.findByFirebaseUid(uid);
      if (user)
        await this.userDeviceService.deregisterDevice(user, {
          deviceToken: '',
        });
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
