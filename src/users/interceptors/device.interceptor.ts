import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Request } from 'express';
import { Observable } from 'rxjs';
import { Repository } from 'typeorm';

import { UserDevice } from 'src/users/entities/user-devices.entity';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class DeviceInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(UserDevice)
    private readonly userDeviceRepo: Repository<UserDevice>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const user: User | undefined = request.user; // Only defined if authenticated

    const deviceToken = request.headers['x-device-token'] as string;
    const platform = request.headers['x-platform'] as 'ios' | 'android' | 'web';
    const osVersion = request.headers['x-os-version'] as string;
    const appVersion = request.headers['x-app-version'] as string;
    const deviceName = request.headers['x-device-name'] as string;

    if (user && deviceToken && platform) {
      let device = await this.userDeviceRepo.findOne({
        where: { deviceToken },
      });

      if (!device) {
        device = this.userDeviceRepo.create({
          user,
          deviceToken,
          platform,
          appVersion,
          name: deviceName,
        });
        await this.userDeviceRepo.save(device);
      } else if (device.user?.id === user.id) {
        // Update only if something changed
        let updated = false;
        if (device.appVersion !== appVersion) {
          device.appVersion = appVersion;
          updated = true;
        }
        if (device.platform !== platform) {
          device.platform = platform;
          updated = true;
        }
        if (device.osVersion !== osVersion) {
          device.osVersion = osVersion;
          updated = true;
        }
        if (device.name !== deviceName) {
          device.name = deviceName;
          updated = true;
        }
        if (updated) {
          await this.userDeviceRepo.save(device);
        }
      }
    }

    return next.handle();
  }
}
