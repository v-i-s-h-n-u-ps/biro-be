import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DeregisterDeviceDto } from '../dtos/deregister-device.dto';
import { RegisterDeviceDto } from '../dtos/register-device.dto';
import { UserDevice } from '../entities/user-devices.entity';
import { User } from '../entities/users.entity';

@Injectable()
export class UserDeviceService {
  constructor(
    @InjectRepository(UserDevice)
    private readonly userDeviceRepo: Repository<UserDevice>,
  ) {}

  async registerDevice(
    user: User,
    dto: RegisterDeviceDto,
  ): Promise<UserDevice> {
    let device = await this.userDeviceRepo.findOne({
      where: { user: { id: user.id }, deviceToken: dto.deviceToken },
    });

    if (!device) {
      device = this.userDeviceRepo.create({
        deviceToken: dto.deviceToken,
        platform: dto.platform,
        appVersion: dto.appVersion,
        name: dto.name,
        user,
      });
    } else {
      device.user = user; // re-assign in case device was linked elsewhere
      device.platform = dto.platform;
      device.appVersion = dto.appVersion;
      device.name = dto.name;
    }

    return this.userDeviceRepo.save(device);
  }

  async deregisterDevice(user: User, dto: DeregisterDeviceDto): Promise<void> {
    const device = await this.userDeviceRepo.findOne({
      where: { deviceToken: dto.deviceToken, user: { id: user.id } },
    });

    if (!device) {
      throw new NotFoundException('Device not found for this user');
    }

    await this.userDeviceRepo.remove(device);
  }

  async getDevicesByUser(user: User): Promise<UserDevice[]> {
    return this.userDeviceRepo.find({
      where: { user: { id: user.id } },
    });
  }

  async getDevicesByUserIds(userIds: string[]): Promise<UserDevice[]> {
    return this.userDeviceRepo
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.user', 'user')
      .where('user.id IN (:...userIds)', { userIds })
      .getMany();
  }
}
