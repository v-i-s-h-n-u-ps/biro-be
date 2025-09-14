// src/auth/guards/firebase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as admin from 'firebase-admin';

import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly userService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userRecord = await admin.auth().getUser(decodedToken.uid);

      // ✅ Check verification status
      if (!userRecord.emailVerified && !userRecord.phoneNumber) {
        throw new ForbiddenException('User is not verified');
      }

      const user = await this.userService.findById(userRecord.uid);

      // Attach user to request
      request.user = {
        ...user,
        claims: decodedToken,
      };

      return true;
    } catch (err: unknown) {
      throw new UnauthorizedException(
        'Invalid or expired Firebase token' + (err as Error).message,
      );
    }
  }
}
