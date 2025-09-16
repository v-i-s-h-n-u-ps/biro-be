import {
  Body,
  Controller,
  Get,
  Param,
  ParseFloatPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { RideStatus } from 'src/common/constants/common.enum';
import { ResourceRole, Role } from 'src/common/constants/rbac.enum';
import { type RequestWithUser } from 'src/common/types/request-with-user';
import { Roles } from 'src/rbac/decorators/roles.decorator';
import { ResourceRolesGuard } from 'src/rbac/guards/resource-roles.guard';

import { CreateRideDto } from '../dtos/create-ride.dto';
import { UpdateRideDto } from '../dtos/update-ride.dto';
import { RideService } from '../services/ride.service';
import { RideSearchService } from '../services/ride-search.service';

@UseGuards(FirebaseAuthGuard, ResourceRolesGuard)
@Controller({ path: 'rides', version: '1' })
export class RideController {
  constructor(
    private readonly rideService: RideService,
    private readonly rideSearchService: RideSearchService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createRide(@Req() req: RequestWithUser, @Body() data: CreateRideDto) {
    return this.rideService.createRide(req.user, data);
  }

  @Patch(':rideId')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(Role.ADMIN, ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
  updateRide(
    @Param('rideId', ParseUUIDPipe) rideId: string,
    @Body() data: UpdateRideDto,
  ) {
    return this.rideService.updateRide(rideId, data);
  }

  @Post(':rideId/join')
  joinRide(
    @Req() req: RequestWithUser,
    @Param('rideId', ParseUUIDPipe) rideId: string,
  ) {
    return this.rideService.joinRide(req.user, rideId);
  }

  @Patch('participants/:participantId/accept')
  @Roles(Role.ADMIN, ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
  acceptParticipant(
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.rideService.acceptParticipant(participantId);
  }

  @Patch(':rideId/cancel')
  @Roles(Role.ADMIN, ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
  cancelRide(@Param('rideId', ParseUUIDPipe) rideId: string) {
    return this.rideService.cancelOrCompleteRide(rideId, RideStatus.CANCELLED);
  }

  @Patch(':rideId/complete')
  @Roles(Role.ADMIN, ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
  completeRide(@Param('rideId', ParseUUIDPipe) rideId: string) {
    return this.rideService.cancelOrCompleteRide(rideId, RideStatus.COMPLETED);
  }

  @Get('nearby')
  async getNearbyRides(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseFloatPipe) radius?: number,
  ) {
    return this.rideSearchService.searchNearbyRides(lat, lng, radius);
  }
}
