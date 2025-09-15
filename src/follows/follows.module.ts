import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RealtimeModule } from 'src/realtime/realtime.module';
import { User } from 'src/users/entities/users.entity';

import { FollowsController } from './controllers/follows.controller';
import { Follow } from './entities/follows.entity';
import { FollowsService } from './services/follows.service';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User]), RealtimeModule],
  providers: [FollowsService],
  controllers: [FollowsController],
  exports: [FollowsService],
})
export class FollowsModule {}
