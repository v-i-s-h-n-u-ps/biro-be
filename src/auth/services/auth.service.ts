import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Verify Firebase ID token and return user with roles & permissions
   */
  async validate(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (err) {
      throw new UnauthorizedException(
        'Invalid or expired Firebase token: ' + err,
      );
    }
  }

  /**
   * Revoke refresh tokens (logout)
   */
  async logout(uid: string) {
    await admin.auth().revokeRefreshTokens(uid);
  }

  /**
   * Optionally create a custom Firebase token
   */
  async createCustomToken(uid: string): Promise<string> {
    return admin.auth().createCustomToken(uid);
  }
}
