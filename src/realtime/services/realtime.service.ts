import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { type Queue } from 'bull';

import {
  QueueName,
  WebSocketNamespace,
} from 'src/common/constants/common.enum';
import { RedisService } from 'src/common/redis.service';

import {
  REALTIME_BACKOFF_DELAY_MS,
  REALTIME_BULL_ATTEMPTS,
} from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';

import { RealtimeQueueService } from './realtime-queue.service';
import { RealtimeStoreService } from './realtime-store.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(
    @InjectQueue(QueueName.Notifications)
    private readonly notificationQueue: Queue<RealtimeJob>,
    @InjectQueue(QueueName.Chat)
    private readonly chatQueue: Queue<RealtimeJob>,
    private readonly redisService: RedisService,
    private readonly queueService: RealtimeQueueService,
    private readonly realtimeStore: RealtimeStoreService,
  ) {}

  async sendAndForgetNotification(job: RealtimeJob, delayMs = 0) {
    if (!job.userIds?.length && !job.roomId) return;
    // 1) filter muted users
    const filteredUserIds = await this.realtimeStore.filterMutedUsers(
      job.userIds,
      job.event,
    );
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
      backoff: REALTIME_BACKOFF_DELAY_MS,
      delay: delayMs,
    };
    switch (job.namespace) {
      case WebSocketNamespace.Chat:
        await this.chatQueue.add(job.event, job, jobOptions);
        break;
      case WebSocketNamespace.Notifications:
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

  async muteNotification(userId: string, type: string, until?: Date) {
    await this.realtimeStore.muteNotification(userId, type, until);
  }

  async unmuteNotification(userId: string, type: string) {
    await this.realtimeStore.unmuteNotification(userId, type);
  }
}
