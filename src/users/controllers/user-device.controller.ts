import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';

import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { type RequestWithUser } from 'src/common/types/request-with-user';

import { DeregisterDeviceDto } from '../dtos/deregister-device.dto';
import { RegisterDeviceDto } from '../dtos/register-device.dto';
import { UserDeviceService } from '../services/user-devices.service';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'users/devices', version: '1' })
export class UserDeviceController {
  constructor(private readonly userDeviceService: UserDeviceService) {}

  @Post('register')
  async registerDevice(
    @Req() req: RequestWithUser,
    @Body() dto: RegisterDeviceDto,
  ) {
    const device = await this.userDeviceService.registerDevice(req.user, dto);
    return { success: true, device };
  }

  @Delete('deregister')
  async deregisterDevice(
    @Req() req: RequestWithUser,
    @Body() dto: DeregisterDeviceDto,
  ) {
    await this.userDeviceService.deregisterDevice(req.user, dto);
    return { success: true };
  }
}
