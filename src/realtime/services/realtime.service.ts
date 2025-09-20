// realtime.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { type Queue } from 'bull';

import {
  QueueName,
  WebSocketNamespace,
} from 'src/common/constants/common.enum';
import { RealtimeKeys } from 'src/common/constants/realtime.keys';
import { RedisService } from 'src/common/redis.service';

import { REALTIME_BULL_ATTEMPTS } from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';

import { RealtimeQueueService } from './realtime-queue.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(
    @InjectQueue(QueueName.NOTIFICATIONS)
    private readonly notificationQueue: Queue<RealtimeJob>,
    @InjectQueue(QueueName.CHAT)
    private readonly chatQueue: Queue<RealtimeJob>,
    private readonly redisService: RedisService,
    private readonly queueService: RealtimeQueueService,
  ) {}

  async sendAndForgetNotification(job: RealtimeJob, delayMs = 0) {
    if (!job.userIds?.length && !job.websocketRoomIds?.length) return;
    // 1) filter muted users
    const filteredUserIds = await this.filterMutedUsers(job.userIds, job.event);
    if (!filteredUserIds.length && !job.options.emitToRoom) return;
    job.userIds = filteredUserIds; // narrow down recipients
    job.createdAt = Date.now();
    // 2) toggle emitToRoom vs emitToUser if both set (original logic preserved, but clarified)
    if (job.options.emitToRoom && job.options.emitToUser) {
      if (filteredUserIds.length === 0) {
        job.options.emitToUser = false;
      } else {
        job.options.emitToRoom = false; // Prefer user if users present
      }
    }
    // 3) store dedup + job body in Redis (so sweep/pending processors can access)
    const stored = await this.queueService.storeJobWithDedup(job);
    if (!stored.length) {
      this.logger.debug(`Duplicate job ignored: ${job.jobId}`);
      return;
    }
    // 4) push to appropriate Bull queue (server busy / background processing)
    const jobOptions = {
      attempts: REALTIME_BULL_ATTEMPTS,
      backoff: 5000,
      delay: delayMs,
    };
    switch (job.namespace) {
      case WebSocketNamespace.CHAT:
        await this.chatQueue.add(job.event, job, jobOptions);
        break;
      case WebSocketNamespace.NOTIFICATIONS:
        await this.notificationQueue.add(job.event, job, jobOptions);
        break;
      default:
        this.logger.warn(
          `Unknown namespace ${job.namespace}, enqueuing to notifications`,
        );
        await this.notificationQueue.add(job.event, job, jobOptions);
        break;
    }
  }

  /**
   * Filter out users who have muted this notification type
   */
  private async filterMutedUsers(userIds: string[], type?: string) {
    if (!type) return userIds.filter((id) => id?.trim());
    const results = await Promise.all(
      userIds.map(async (uid) => {
        if (!uid?.trim()) return null;
        const isMuted = await this.redisService.client.sismember(
          RealtimeKeys.mutedNotifications(uid),
          type,
        );
        return isMuted ? null : uid;
      }),
    );
    return results.filter((id): id is string => !!id);
  }

  /**
   * Add a type to muted notifications
   */
  async muteNotification(userId: string, type: string, until?: Date) {
    if (!userId?.trim() || !type?.trim()) return;
    const key = RealtimeKeys.mutedNotifications(userId);
    await this.redisService.client.sadd(key, type);
    if (until) {
      const ttl = Math.ceil((until.getTime() - Date.now()) / 1000);
      if (ttl > 0) await this.redisService.client.expire(key, ttl);
    }
  }

  /**
   * Remove a type from muted notifications
   */
  async unmuteNotification(userId: string, type: string) {
    if (!userId?.trim() || !type?.trim()) return;
    const key = RealtimeKeys.mutedNotifications(userId);
    await this.redisService.client.srem(key, type);
  }
}
