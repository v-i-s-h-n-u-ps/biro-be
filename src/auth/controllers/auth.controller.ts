import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { UserResponseDto } from 'src/common/dtos/user-response.dto';
import { type RequestWithUser } from 'src/common/types/request-with-user';

import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { AuthService } from '../services/auth.service';

@UseGuards(FirebaseAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getProfile(@Req() req: RequestWithUser) {
    return plainToInstance(UserResponseDto, req.user, {
      strategy: 'excludeAll',
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: RequestWithUser) {
    await this.authService.logout(req.user.firebaseUid);
  }
}
