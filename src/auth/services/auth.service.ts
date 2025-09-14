import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
  ) {}

  /**
   * Verify Firebase ID token and return user with roles & permissions
   */
  async validate(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.firebaseAdmin
        .auth()
        .verifyIdToken(idToken);
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
    await this.firebaseAdmin.auth().revokeRefreshTokens(uid);
  }

  /**
   * Optionally create a custom Firebase token
   */
  async createCustomToken(uid: string): Promise<string> {
    return this.firebaseAdmin.auth().createCustomToken(uid);
  }
}
