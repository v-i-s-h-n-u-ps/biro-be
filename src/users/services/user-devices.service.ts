import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

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
      where: { user, deviceToken: dto.deviceToken },
    });

    if (!device) {
      device = this.userDeviceRepo.create({ user, ...dto });
    } else {
      device = Object.assign(device, dto);
    }

    return this.userDeviceRepo.save(device);
  }

  async deregisterDevice(deviceToken: string): Promise<void> {
    const device = await this.userDeviceRepo.findOne({
      where: { deviceToken },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    device.isActive = false;

    await this.userDeviceRepo.save(device);
  }

  async removeDevicesByTokens(tokens: string[]): Promise<void> {
    await this.userDeviceRepo
      .createQueryBuilder()
      .update(UserDevice)
      .set({ isActive: false })
      .where('deviceToken IN (:...tokens)', { tokens })
      .execute();
  }

  async getDeviceByIds(ids: string[]): Promise<UserDevice[]> {
    return await this.userDeviceRepo.findBy({ id: In(ids), isActive: true });
  }

  async getDevicesByUser(user: User): Promise<UserDevice[]> {
    return this.userDeviceRepo.find({ where: { user, isActive: true } });
  }

  async getDevicesByUserIds(userIds: string[]): Promise<UserDevice[]> {
    return this.userDeviceRepo
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.user', 'user')
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('device.isActive = :isActive', { isActive: true })
      .getMany();
  }
}
