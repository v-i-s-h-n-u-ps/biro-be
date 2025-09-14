import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { User } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Verify Firebase ID token and return user with roles & permissions
   */
  async validate(token: string): Promise<User> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      let user = await this.usersService.findByUid(decodedToken.uid);

      // If user doesn't exist, create it with default role from RBAC
      if (!user) {
        user = await this.usersService.createUser({
          uid: decodedToken.uid,
          email: decodedToken.email ?? undefined,
          phone: decodedToken.phone_number ?? undefined,
          name: 'Anonymous',
        });
      }

      return user;
    } catch (err) {
      console.error('Firebase token validation failed:', err);
      throw new UnauthorizedException('Invalid Firebase token');
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
