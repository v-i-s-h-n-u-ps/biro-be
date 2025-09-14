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

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
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

      // Attach user to request
      request.user = {
        uid: userRecord.uid,
        email: userRecord.email,
        phone: userRecord.phoneNumber,
        emailVerified: userRecord.emailVerified,
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
