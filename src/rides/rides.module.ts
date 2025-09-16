import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { RbacModule } from 'src/rbac/rbac.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { UsersModule } from 'src/users/users.module';

import { RideController } from './controllers/ride.controller';
import { RideParticipant } from './entities/ride-participants.entity';
import { Ride } from './entities/rides.entity';
import { RideGateway } from './gateways/rides.gateway';
import { RideService } from './services/ride.service';
import { RideLocationService } from './services/ride-location.service';
import { RideSearchService } from './services/ride-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, RideParticipant]),
    RbacModule,
    RealtimeModule,
    UsersModule,
  ],
  providers: [
    RedisService,
    PresenceService,
    RideLocationService,
    RideService,
    RideGateway,
    RideSearchService,
  ],
  controllers: [RideController],
})
export class RideModule {}
