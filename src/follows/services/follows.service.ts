import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { FollowStatus, RealtimeType } from 'src/common/constants/common.enum';
import { RealtimeService } from 'src/realtime/services/realtime.service';
import { User } from 'src/users/entities/users.entity';

import { Follow } from '../entities/follows.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly realtimeService: RealtimeService,
  ) {}

  private async increaseFollowCounts(
    manager: EntityManager,
    followerId: string,
    followingId: string,
  ) {
    await manager.increment(
      User,
      { id: followingId },
      'profile.followersCount',
      1,
    );

    await manager.increment(
      User,
      { id: followerId },
      'profile.followingCount',
      1,
    );
  }

  private async decreaseFollowCounts(
    manager: EntityManager,
    followerId: string,
    followingId: string,
  ) {
    await manager.decrement(
      User,
      { id: followingId },
      'profile.followersCount',
      1,
    );
    await manager.decrement(
      User,
      { id: followerId },
      'profile.followingCount',
      1,
    );
  }

  /** Send follow request or auto-accept if public */
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException("You can't follow yourself");
    }

    const follower = await this.userRepo.findOne({ where: { id: followerId } });
    const following = await this.userRepo.findOne({
      where: { id: followingId },
      relations: ['profile'],
    });

    if (!following || !follower) throw new NotFoundException('User not found');

    const follow = await this.followRepo.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });

    if (follow) {
      throw new BadRequestException('Already requested/following');
    }

    const isPrivate = following.profile.isPrivate;

    return await this.followRepo.manager.transaction(async (manager) => {
      let follow = manager.create(this.followRepo.target, {
        follower,
        following,
        status: isPrivate ? FollowStatus.PENDING : FollowStatus.ACCEPTED,
      });

      follow = await manager.save(follow);

      if (isPrivate) {
        // Notify the target user
        await this.realtimeService.sendNotification({
          userIds: [followingId],
          type: RealtimeType.FOLLOW_REQUEST,
          body: `${follower.profile.name} requested to follow you`,
          data: { followerId },
        });
      } else {
        // Update counts
        await this.increaseFollowCounts(manager, followerId, followingId);

        // Notify the target user
        await this.realtimeService.sendNotification({
          userIds: [followingId],
          type: RealtimeType.FOLLOWED,
          body: `${follower.profile.name} started following you`,
          data: { followerId },
        });
        await this.realtimeService.sendNotification({
          userIds: [followerId],
          type: RealtimeType.FOLLOWED,
          body: `You started following ${following.profile.name}`,
          data: { followingId },
        });
      }

      return follow;
    });
  }

  /** Accept a follow request */
  async acceptRequest(userId: string, followId: string) {
    const follow = await this.followRepo.findOne({
      where: {
        id: followId,
        following: { id: userId },
        status: FollowStatus.PENDING,
      },
      relations: ['follower', 'following'],
    });
    if (!follow) throw new NotFoundException('Request not found');

    await this.followRepo.manager.transaction(async (manager) => {
      follow.status = FollowStatus.ACCEPTED;
      await manager.save(follow);

      await this.increaseFollowCounts(manager, follow.follower.id, userId);
    });

    // Notify the requester
    await this.realtimeService.sendNotification({
      userIds: [follow.follower.id],
      type: RealtimeType.FOLLOWED,
      body: `${follow.following.profile.name} accepted your follow request`,
      data: { followingId: userId },
    });
    await this.realtimeService.sendNotification({
      userIds: [userId],
      type: RealtimeType.FOLLOWED,
      body: `You started following ${follow.follower.profile.name}`,
      data: { followerId: follow.follower.id },
    });

    return follow;
  }

  async removeFollow(followId: string) {
    const follow = await this.followRepo.findOne({ where: { id: followId } });
    if (!follow) throw new NotFoundException('Not found');

    await this.followRepo.manager.transaction(async (manager) => {
      await manager.remove(follow);
      if (follow.status === FollowStatus.ACCEPTED) {
        await this.decreaseFollowCounts(
          manager,
          follow.follower.id,
          follow.following.id,
        );
      }
    });

    return true;
  }
}
