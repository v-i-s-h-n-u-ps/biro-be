import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RbacModule } from 'src/rbac/rbac.module';

import { UserDeviceController } from './controllers/user-device.controller';
import { UsersController } from './controllers/users.controller';
import { UserDevice } from './entities/user-devices.entity';
import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/users.entity';
import { DeviceInterceptor } from './interceptors/device.interceptor';
import { UserDeviceService } from './services/user-devices.service';
import { UserProfileService } from './services/user-profile.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserDevice]),
    RbacModule,
  ],
  providers: [
    UsersService,
    UserProfileService,
    UserDeviceService,
    DeviceInterceptor,
  ],
  controllers: [UsersController, UserDeviceController],
  exports: [UsersService, UserProfileService, UserDeviceService],
})
export class UsersModule {}
