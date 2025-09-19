import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type Request } from 'express';

import { Public } from 'src/common/decorators/public.decorator';
import { UserResponseDto } from 'src/common/dtos/user-response.dto';

import { AuthenticationService } from '../services/authentication.service';

@Controller({ path: 'auth', version: '1' })
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('login')
  @Public()
  async getProfile(@Body() body: { idToken: string }) {
    if (!body.idToken) throw new UnauthorizedException('ID token is required');
    const user = await this.authService.validateAndLogin(body.idToken);
    return plainToInstance(UserResponseDto, user, {
      strategy: 'excludeAll',
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request) {
    await this.authService.logout(req.user.firebaseUid);
  }
}
