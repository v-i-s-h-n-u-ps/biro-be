import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RealtimeModule } from 'src/realtime/realtime.module';
import { User } from 'src/users/entities/users.entity';
import { UsersModule } from 'src/users/users.module';

import { ConnectionsController } from './controllers/connections.controller';
import { Follow } from './entities/follows.entity';
import { UserBlock } from './entities/user-blocks.entity';
import { ConnectionsService } from './services/connections.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow, User, UserBlock]),
    RealtimeModule,
    UsersModule,
  ],
  providers: [ConnectionsService],
  controllers: [ConnectionsController],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
