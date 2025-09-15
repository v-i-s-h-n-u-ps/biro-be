import {
  Body,
  Controller,
  Headers,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as admin from 'firebase-admin';

import { UserResponseDto } from 'src/common/dtos/user-response.dto';
import { UsersService } from 'src/users/services/users.service';

import { LogoutResponseDto } from '../dtos/logout-response.dto';
import { AuthService } from '../services/auth.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('signup')
  async signup(@Body('idToken') idToken: string) {
    const decodedToken = await this.authService.validate(idToken);

    let user = await this.usersService.findByFirebaseUid(decodedToken.uid);
    if (!user) {
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);

      user = await this.usersService.createUser({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber,
        name: firebaseUser.displayName || 'Anonymous',
        emailVerified: firebaseUser.emailVerified,
      });
    }

    return plainToInstance(UserResponseDto, user, { strategy: 'excludeAll' });
  }

  @Post('login')
  async login(@Body('idToken') idToken: string) {
    const decodedToken = await this.authService.validate(idToken);
    const user = await this.usersService.findByFirebaseUid(decodedToken.uid);
    if (!user)
      throw new NotFoundException('User not found, please sign up first');

    await this.usersService.updateLastLogin(user.id);

    return plainToInstance(UserResponseDto, user, { strategy: 'excludeAll' });
  }

  @Post('logout')
  async logout(@Headers('x-firebase-uid') uid: string) {
    if (!uid) throw new Error('Firebase UID required');
    await this.authService.logout(uid);
    return plainToInstance(
      LogoutResponseDto,
      { message: 'Logged out' },
      { strategy: 'excludeAll' },
    );
  }
}
