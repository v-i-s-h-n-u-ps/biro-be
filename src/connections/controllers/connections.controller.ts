import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { type RequestWithUser } from 'src/common/types/request-with-user';

import { ConnectionsService } from '../services/connections.service';

@UseGuards(FirebaseAuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post(':userId/follow')
  followUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    return this.connectionsService.followUser(req.user.id, targetId);
  }

  @Patch(':followId/accept')
  acceptRequest(
    @Req() req: RequestWithUser,
    @Param('followId', ParseUUIDPipe) followId: string,
  ) {
    return this.connectionsService.acceptRequest(req.user.id, followId);
  }

  @Patch(':followId/reject')
  rejectRequest(
    @Req() req: RequestWithUser,
    @Param('followId', ParseUUIDPipe) followId: string,
  ) {
    return this.connectionsService.rejectRequest(req.user.id, followId);
  }

  @Delete(':userId/unfollow')
  unfollowUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    return this.connectionsService.unfollowUser(req.user.id, targetId);
  }

  @Patch(':userId/block')
  blockUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    return this.connectionsService.blockUser(req.user.id, targetId);
  }

  @Patch(':userId/unblock')
  unblockUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    return this.connectionsService.unblockUser(req.user.id, targetId);
  }
}
