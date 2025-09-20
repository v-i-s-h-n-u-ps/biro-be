import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly userService: UsersService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers['authorization'];

    if (!authHeader) throw new UnauthorizedException('You are not logged in');

    const token = authHeader.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('You are not logged in');

    try {
      const decodedToken = await this.firebaseService.verify(token);
      const userRecord = await this.firebaseService.getUser(decodedToken.uid);

      if (!userRecord.emailVerified && !userRecord.phoneNumber) {
        throw new ForbiddenException('User is not verified');
      }

      const user = await this.userService.findById(userRecord.uid);
      request.user = { ...user, claims: decodedToken };

      return true;
    } catch (err: unknown) {
      throw new UnauthorizedException(
        'Invalid or expired Firebase token' + (err as Error).message,
      );
    }
  }
}
