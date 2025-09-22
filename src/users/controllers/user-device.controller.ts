import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import { type Request } from 'express';

import { DeregisterDeviceDto } from '../dtos/deregister-device.dto';
import { RegisterDeviceDto } from '../dtos/register-device.dto';
import { UserDeviceService } from '../services/user-devices.service';

@Controller({ path: 'users/devices', version: '1' })
export class UserDeviceController {
  constructor(private readonly userDeviceService: UserDeviceService) {}

  @Post('register')
  async registerDevice(@Req() req: Request, @Body() dto: RegisterDeviceDto) {
    const device = await this.userDeviceService.registerDevice(req.user, dto);
    return { success: true, device };
  }

  @Patch('deregister')
  async deregisterDevice(@Body() dto: DeregisterDeviceDto) {
    await this.userDeviceService.deregisterDevice(dto.deviceToken);
    return { success: true };
  }
}
