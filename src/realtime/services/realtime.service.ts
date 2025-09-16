import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { type Queue } from 'bull';

import { QueueName } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';

import { RealtimeJob } from '../interfaces/realtime-job.interface';

@Injectable()
export class RealtimeService {
  constructor(
    @InjectQueue(QueueName.NOTIFICATIONS)
    private readonly notificationQueue: Queue<RealtimeJob>,
    @InjectQueue(QueueName.CHAT)
    private readonly chatQueue: Queue<RealtimeJob>,
    private readonly presenceService: PresenceService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Enqueue a notification to be sent immediately
   */
  async sendAndForgetNotification(job: RealtimeJob, delayMs = 0) {
    const filteredUserIds = await this.filterMutedUsers(job.userIds, job.type);
    if (!filteredUserIds.length) return;
    if (job.options.emitToRoom && job.options.emitToUser) {
      if (filteredUserIds.length === 0) {
        job.options.emitToUser = false;
      } else {
        job.options.emitToRoom = false;
      }
    }
    await this.notificationQueue.add(job, {
      attempts: 3,
      backoff: 5000,
      delay: delayMs,
    });
  }

  /**
   * Filter out users who have muted this notification type
   */
  private async filterMutedUsers(userIds: string[], type?: string) {
    if (!type) return userIds;

    const results = await Promise.all(
      userIds.map(async (uid) => {
        const muteKey = `user:${uid}:muted_notifications`;
        const isMuted = await this.redisService.client.sismember(muteKey, type);
        return isMuted ? null : uid;
      }),
    );

    return results.filter((id): id is string => !!id);
  }

  /**
   * Add a type to muted notifications
   */
  async muteNotification(userId: string, type: string, until?: Date) {
    const key = `user:${userId}:muted_notifications`;
    await this.redisService.client.sadd(key, type);
    if (until) {
      const ttl = Math.ceil((until.getTime() - Date.now()) / 1000);
      await this.redisService.client.expire(key, ttl);
    }
  }

  /**
   * Remove a type from muted notifications
   */
  async unmuteNotification(userId: string, type: string) {
    const key = `user:${userId}:muted_notifications`;
    await this.redisService.client.srem(key, type);
  }
}
