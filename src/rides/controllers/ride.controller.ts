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
import { plainToInstance } from 'class-transformer';
import { type Request } from 'express';

import { ResourceRoles } from 'src/authorization/rbac/decorators/resource-roles.decorator';
import { Roles } from 'src/authorization/rbac/decorators/roles.decorator';
import { RideStatus } from 'src/common/constants/common.enum';
import { ResourceRole, Role } from 'src/common/constants/rbac.enum';
import { UserBasicDetailsDto } from 'src/common/dtos/user-basic-details.dto';

import { CreateRideDto } from '../dtos/create-ride.dto';
import { UpdateRideDto } from '../dtos/update-ride.dto';
import { RideRolesGuard } from '../guards/ride-roles.guard';
import { RideService } from '../services/ride.service';
import { RideSearchService } from '../services/ride-search.service';

@UseGuards(RideRolesGuard)
@Controller({ path: 'rides', version: '1' })
export class RideController {
  constructor(
    private readonly rideService: RideService,
    private readonly rideSearchService: RideSearchService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createRide(@Req() req: Request, @Body() data: CreateRideDto) {
    return this.rideService.createRide(req.user, data);
  }

  @Patch(':rideId')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Roles(Role.ADMIN)
  @ResourceRoles(ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
  updateRide(
    @Param('rideId', ParseUUIDPipe) rideId: string,
    @Body() data: UpdateRideDto,
  ) {
    return this.rideService.updateRide(rideId, data);
  }

  @Post(':rideId/join')
  joinRide(
    @Req() req: Request,
    @Param('rideId', ParseUUIDPipe) rideId: string,
  ) {
    return this.rideService.joinRide(req.user, rideId);
  }

  @Patch(':rideId/participants/:participantId/accept')
  @Roles(Role.ADMIN)
  @ResourceRoles(ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
  acceptParticipant(
    @Param('rideId', ParseUUIDPipe) rideId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.rideService.acceptParticipant(rideId, participantId);
  }

  @Get(':rideId/participants')
  async getParticipants(@Param('rideId', ParseUUIDPipe) rideId: string) {
    const participants = await this.rideService.getParticipants(rideId);
    const response = {
      count: participants.length,
      participants: participants.map((p) =>
        plainToInstance(UserBasicDetailsDto, p.participant),
      ),
    };
    return response;
  }

  @Patch(':rideId/cancel')
  @Roles(Role.ADMIN)
  @ResourceRoles(ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
  cancelRide(@Param('rideId', ParseUUIDPipe) rideId: string) {
    return this.rideService.cancelOrCompleteRide(rideId, RideStatus.CANCELLED);
  }

  @Patch(':rideId/complete')
  @Roles(Role.ADMIN)
  @ResourceRoles(ResourceRole.RIDE_OWNER, ResourceRole.RIDE_MODERATOR)
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
