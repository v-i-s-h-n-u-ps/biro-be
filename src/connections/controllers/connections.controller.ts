import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { FirebaseAuthGuard } from 'src/authentication/guards/firebase-auth.guard';
import { type RequestWithUser } from 'src/common/types/request-with-user';

import { FollowDto } from '../dtos/responses/follow.dto';
import { FollowUserDto } from '../dtos/responses/follow-users.dto';
import { ConnectionsService } from '../services/connections.service';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'connections', version: '1' })
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post(':userId/follow')
  async followUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    const follow = await this.connectionsService.followUser(
      req.user.id,
      targetId,
    );
    return plainToInstance(FollowDto, follow);
  }

  @Patch(':followId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptRequest(
    @Req() req: RequestWithUser,
    @Param('followId', ParseUUIDPipe) followId: string,
  ) {
    await this.connectionsService.acceptRequest(req.user.id, followId);
  }

  @Patch(':followId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  rejectRequest(
    @Req() req: RequestWithUser,
    @Param('followId', ParseUUIDPipe) followId: string,
  ) {
    return this.connectionsService.rejectRequest(req.user.id, followId);
  }

  @Delete(':userId/unfollow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    await this.connectionsService.unfollowUser(req.user.id, targetId);
  }

  @Patch(':userId/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async blockUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    await this.connectionsService.blockUser(req.user.id, targetId);
  }

  @Patch(':userId/unblock')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    await this.connectionsService.unblockUser(req.user.id, targetId);
  }

  @Get(':userId/followers')
  async getFollowers(@Param('userId', ParseUUIDPipe) userId: string) {
    const followers = await this.connectionsService.getFollowers(userId);
    const response = {
      count: followers.length,
      users: followers.map((user) => plainToInstance(FollowUserDto, user)),
    };
    return response;
  }

  @Get(':userId/following')
  async getFollowing(@Param('userId', ParseUUIDPipe) userId: string) {
    const following = await this.connectionsService.getFollowing(userId);
    const response = {
      count: following.length,
      users: following.map((user) => plainToInstance(FollowUserDto, user)),
    };
    return response;
  }

  @Get(':userId/follow-requests')
  async getFollowRequests(@Param('userId', ParseUUIDPipe) userId: string) {
    const followRequests =
      await this.connectionsService.getFollowRequests(userId);
    const response = {
      count: followRequests.length,
      users: followRequests.map((user) => plainToInstance(FollowUserDto, user)),
    };
    return response;
  }
}
