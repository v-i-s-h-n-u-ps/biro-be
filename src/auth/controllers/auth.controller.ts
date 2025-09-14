import { Body, Controller, Headers, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { UserResponseDto } from 'src/common/dtos/user-response.dto';

import { LogoutResponseDto } from '../dtos/logout-response.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body('idToken') idToken: string) {
    const user = await this.authService.validate(idToken);
    return plainToInstance(UserResponseDto, user, { strategy: 'excludeAll' });
  }

  @Post('login')
  async login(@Body('idToken') idToken: string) {
    const user = await this.authService.validate(idToken);
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
