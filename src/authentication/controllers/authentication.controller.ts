import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type Request } from 'express';

import { UserResponseDto } from 'src/common/dtos/user-response.dto';

import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { AuthenticationService } from '../services/authentication.service';

@UseGuards(FirebaseAuthGuard)
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Get('login')
  async getProfile(@Body() body: { idToken: string }) {
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
