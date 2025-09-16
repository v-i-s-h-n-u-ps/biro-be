import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import {
  DeliveryStrategy,
  FollowStatus,
  WebSocketNamespace,
} from 'src/common/constants/common.enum';
import { NotificationEvents } from 'src/common/constants/notification-events.enum';
import { RealtimePayload } from 'src/realtime/interfaces/realtime-job.interface';
import { RealtimeService } from 'src/realtime/services/realtime.service';
import { User } from 'src/users/entities/users.entity';

import { Follow } from '../entities/follows.entity';
import { UserBlock } from '../entities/user-blocks.entity';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(UserBlock)
    private readonly blockRepo: Repository<UserBlock>,
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

  private async sendNotification({
    userIds,
    event,
    ...payload
  }: {
    userIds: string[];
    event: NotificationEvents;
  } & RealtimePayload) {
    await this.realtimeService.sendAndForgetNotification({
      userIds,
      event,
      namespace: WebSocketNamespace.NOTIFICATIONS,
      websocketRoomIds: [],
      options: {
        strategy: DeliveryStrategy.PUSH_ONLY,
        emitToRoom: false,
        emitToUser: true,
      },
      payload,
    });
  }

  private getUserData(user: User) {
    return {
      ...user,
      ...user.profile,
    };
  }

  /** Send follow request or auto-accept if public */
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException("You can't follow yourself");
    }

    const follower = await this.userRepo.findOne({
      where: { id: followerId },
      relations: ['profile'],
    });
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
        await this.sendNotification({
          userIds: [followerId],
          event: NotificationEvents.NOTIFICATION_FOLLOW_REQUEST,
          title: 'Follow Request Sent',
          body: `Your follow request to ${following.profile.name} is pending`,
          icon: follower.profile.avatarUrl,
          data: { followerId },
        });
      } else {
        // Update counts
        await this.increaseFollowCounts(manager, followerId, followingId);

        await this.sendNotification({
          userIds: [followerId],
          event: NotificationEvents.NOTIFICATION_FOLLOW_NEW,
          title: 'Followed',
          icon: following.profile.avatarUrl,
          body: `You started following ${following.profile.name}`,
          data: { followingId },
        });
        await this.sendNotification({
          userIds: [followerId],
          event: NotificationEvents.NOTIFICATION_FOLLOW_NEW,
          title: 'Followed',
          icon: following.profile.avatarUrl,
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

    if (follow.following.id !== userId) {
      throw new BadRequestException(
        'You are not allowed to accept this request',
      );
    }

    await this.followRepo.manager.transaction(async (manager) => {
      follow.status = FollowStatus.ACCEPTED;
      await manager.save(follow);

      await this.increaseFollowCounts(manager, follow.follower.id, userId);
    });

    await this.sendNotification({
      userIds: [follow.follower.id],
      title: 'Follow Request Accepted',
      event: NotificationEvents.NOTIFICATION_FOLLOW_ACCEPTED,
      icon: follow.following.profile.avatarUrl,
      body: `${follow.following.profile.name} accepted your follow request`,
      data: { followingId: userId },
    });
    await this.sendNotification({
      userIds: [userId],
      title: 'You Followed',
      event: NotificationEvents.NOTIFICATION_FOLLOW_NEW,
      icon: follow.follower.profile.avatarUrl,
      body: `You started following ${follow.follower.profile.name}`,
      data: { followerId: follow.follower.id },
    });

    return follow;
  }

  /** Reject request */
  async rejectRequest(userId: string, followId: string) {
    const follow = await this.followRepo.findOne({
      where: {
        id: followId,
        following: { id: userId },
        status: FollowStatus.PENDING,
      },
      relations: ['follower'],
    });
    if (!follow) throw new NotFoundException('Request not found');

    if (follow.following.id !== userId) {
      throw new BadRequestException(
        'You are not allowed to reject this request',
      );
    }

    await this.followRepo.remove(follow);

    return true;
  }

  /** Unfollow */
  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.followRepo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
        status: FollowStatus.ACCEPTED,
      },
      relations: ['follower', 'following'],
    });

    if (!follow) throw new NotFoundException('Not following');

    await this.followRepo.manager.transaction(async (manager) => {
      await manager.remove(follow);

      await this.decreaseFollowCounts(manager, followerId, followingId);
    });

    return true;
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId)
      throw new BadRequestException("You can't block yourself");

    const blocker = await this.userRepo.findOne({ where: { id: blockerId } });
    const blocked = await this.userRepo.findOne({ where: { id: blockedId } });
    if (!blocker || !blocked) throw new NotFoundException('User not found');

    const existing = await this.blockRepo.findOne({
      where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
    });
    if (existing) throw new BadRequestException('User already blocked');

    await this.followRepo.manager.transaction(async (manager) => {
      // Remove any existing follow relationships
      const followsToRemove = await manager.find(Follow, {
        where: [
          {
            follower: { id: blockerId },
            following: { id: blockedId },
            status: FollowStatus.ACCEPTED,
          },
          {
            follower: { id: blockedId },
            following: { id: blockerId },
            status: FollowStatus.ACCEPTED,
          },
        ],
      });

      if (followsToRemove.length > 0) {
        // Collect follower and following IDs
        const followerIds = followsToRemove.map((f) => f.follower.id);
        const followingIds = followsToRemove.map((f) => f.following.id);

        // Bulk decrement followersCount
        await manager
          .createQueryBuilder()
          .update(User)
          .set({
            'profile.followersCount': () => '"profile"."followersCount" - 1',
          })
          .where('id IN (:...ids)', { ids: followingIds })
          .execute();

        // Bulk decrement followingCount
        await manager
          .createQueryBuilder()
          .update(User)
          .set({
            'profile.followingCount': () => '"profile"."followingCount" - 1',
          })
          .where('id IN (:...ids)', { ids: followerIds })
          .execute();

        // Remove follow rows
        await manager.remove(followsToRemove);
      }

      // Add block
      const block = manager.create(UserBlock, { blocker, blocked });
      await manager.save(block);
    });

    return true;
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.blockRepo.findOne({
      where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
    });
    if (!block) throw new NotFoundException('Not found');
    return this.blockRepo.remove(block);
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const blocks = await this.blockRepo.find({
      where: { blocker: { id: userId } },
      relations: ['blocked', 'blocked.profile'],
      order: { createdAt: 'DESC' },
    });
    return blocks.map((b) => this.getUserData(b.blocked));
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await this.followRepo.find({
      where: { following: { id: userId }, status: FollowStatus.ACCEPTED },
      relations: ['follower', 'follower.profile'],
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => this.getUserData(f.follower));
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await this.followRepo.find({
      where: { follower: { id: userId }, status: FollowStatus.ACCEPTED },
      relations: ['following', 'following.profile'],
      order: { createdAt: 'DESC' },
    });
    return follows.map((f) => this.getUserData(f.following));
  }

  async getFollowRequests(userId: string): Promise<User[]> {
    const requests = await this.followRepo.find({
      where: { following: { id: userId }, status: FollowStatus.PENDING },
      relations: ['follower', 'follower.profile'],
      order: { createdAt: 'DESC' },
    });
    return requests.map((f) => this.getUserData(f.follower));
  }
}
