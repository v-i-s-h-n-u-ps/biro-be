import {
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { type RequestWithUser } from 'src/common/types/request-with-user';

import { FollowsService } from '../services/follows.service';

@UseGuards(FirebaseAuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId')
  followUser(
    @Req() req: RequestWithUser,
    @Param('userId', ParseUUIDPipe) targetId: string,
  ) {
    return this.followsService.followUser(req.user.id, targetId);
  }

  @Patch(':followId/accept')
  acceptRequest(
    @Req() req: RequestWithUser,
    @Param('followId', ParseUUIDPipe) followId: string,
  ) {
    return this.followsService.acceptRequest(req.user.id, followId);
  }

  @Patch(':followId')
  rejectRequest(@Param('followId', ParseUUIDPipe) followId: string) {
    return this.followsService.removeFollow(followId);
  }
}
