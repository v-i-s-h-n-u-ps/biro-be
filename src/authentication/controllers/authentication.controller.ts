import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type Request } from 'express';

import { Public } from 'src/common/decorators/public.decorator';
import { SkipInterceptor } from 'src/common/decorators/skip-interceptor.decorator';
import { UserResponseDto } from 'src/common/dtos/user-response.dto';
import { RegisterDeviceDto } from 'src/users/dtos/register-device.dto';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { AuthenticationService } from '../services/authentication.service';

@Controller({ path: 'auth', version: '1' })
export class AuthenticationController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly userDeviceService: UserDeviceService,
  ) {}

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
  @SkipInterceptor()
  async logout(
    @Req() req: Request,
    @Headers('x-device-info') deviceInfo: string,
  ) {
    const device = plainToInstance(RegisterDeviceDto, JSON.parse(deviceInfo), {
      exposeDefaultValues: true,
      enableImplicitConversion: true,
    });
    if (device.deviceToken) {
      await this.userDeviceService.deregisterDevice(
        req.user,
        device.deviceToken,
      );
    }
    await this.authService.logout(req.user.firebaseUid);
  }
}
