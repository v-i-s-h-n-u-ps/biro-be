import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthorizationModule } from 'src/authorization/authorization.module';
import { Follow } from 'src/connections/entities/follows.entity';
import { RideParticipant } from 'src/rides/entities/ride-participants.entity';
import { Story } from 'src/stories/entities/story.entity';

import { UserDeviceController } from './controllers/user-device.controller';
import { UsersController } from './controllers/users.controller';
import { UserDevice } from './entities/user-devices.entity';
import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/users.entity';
import { DeviceInterceptor } from './interceptors/device.interceptor';
import { SuggestionService } from './services/suggestion.service';
import { UserDeviceService } from './services/user-devices.service';
import { UserProfileService } from './services/user-profile.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserDevice,
      Follow,
      RideParticipant,
      Story,
    ]),
    AuthorizationModule,
  ],
  providers: [
    UsersService,
    SuggestionService,
    UserProfileService,
    UserDeviceService,
    DeviceInterceptor,
  ],
  controllers: [UsersController, UserDeviceController],
  exports: [UsersService, UserProfileService, UserDeviceService],
})
export class UsersModule {}
