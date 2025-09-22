import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';

import { RealtimeKeys } from 'src/common/constants/realtime.keys';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';

import {
  REALTIME_DEDUP_TTL_MS,
  REALTIME_JOB_TTL_SECONDS,
  REALTIME_PENDING_TTL_SECONDS,
} from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';

import { RealtimeStoreService } from './realtime-store.service';

@Injectable()
export class RealtimeQueueService {
  private readonly logger = new Logger(RealtimeQueueService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly presenceService: PresenceService,
    private readonly realtimeStore: RealtimeStoreService,
  ) {}

  async storeJobWithDedup(
    job: RealtimeJob,
    deviceIds?: string[],
  ): Promise<string[]> {
    if (!job.jobId?.trim()) return [];
    const emittedDevices: string[] = [];
    if (deviceIds?.length) {
      deviceIds = deviceIds.filter((id) => id?.trim());
      const devicesToDedup = deviceIds?.length ? deviceIds : ['global'];
      const dedupMap = await this.realtimeStore.dedupMultiSet(
        job.jobId,
        devicesToDedup,
        REALTIME_DEDUP_TTL_MS,
      );
      emittedDevices.push(...devicesToDedup.filter((id) => dedupMap[id]));
    } else {
      const dedupMap = await this.realtimeStore.dedupMultiSet(
        job.jobId,
        ['global'],
        REALTIME_DEDUP_TTL_MS,
      );
      if (dedupMap['global']) emittedDevices.push('global');
    }
    if (emittedDevices.length) {
      try {
        await this.realtimeStore
          .manageJob(job.jobId)
          .set(job, REALTIME_JOB_TTL_SECONDS);
      } catch (err) {
        this.logger.error(`Failed to store job ${job.jobId}`, err);
      }
    }
    return emittedDevices;
  }

  async addPendingForDevice(
    userId: string,
    deviceId: string,
    job: RealtimeJob,
  ) {
    if (!userId?.trim() || !deviceId?.trim() || !job.jobId?.trim()) return;
    await this.realtimeStore.addPendingJob(
      userId,
      deviceId,
      job.jobId,
      REALTIME_PENDING_TTL_SECONDS,
    );
  }

  async flushPendingForDevice(
    userId: string,
    deviceId: string,
    emitToSocketFn: (job: RealtimeJob, socketId: string) => void,
  ) {
    const jobIds = await this.realtimeStore.fetchPendingJobIds(
      userId,
      deviceId,
    );
    if (!jobIds.length) return;

    const key = RealtimeKeys.userDevices(userId);
    const socketId = await this.presenceService.getSocketForDevice(
      key,
      deviceId,
    );
    if (!socketId) return;
    for (const jobId of jobIds) {
      await this.redisService.withLock(
        `pending:${userId}:${deviceId}:${jobId}`,
        async () => {
          const job = await this.realtimeStore.manageJob(jobId).get();
          if (!job) {
            await this.realtimeStore.removePendingJob(userId, deviceId, jobId);
            return;
          }

          try {
            emitToSocketFn(job, socketId);

            // --- Mark as delivered ---
            await this.realtimeStore
              .attemptCount(userId, deviceId, jobId)
              .increment();
            await this.confirmDelivery(jobId, userId, deviceId);
          } catch (err) {
            // increment attempt count even on WS failure
            await this.realtimeStore
              .attemptCount(userId, deviceId, jobId)
              .increment();
            this.logger.error(
              `emit failed for ${userId}:${deviceId} job ${jobId}`,
              err,
            );
          }
        },
      );
    }
  }

  async confirmDelivery(jobId: string, userId: string, deviceId: string) {
    if (!jobId?.trim() || !userId?.trim() || !deviceId?.trim()) return;
    await this.redisService.withLock(
      `pending:${userId}:${deviceId}:${jobId}`,
      async () => {
        const cleaned = await this.realtimeStore.removePendingJobFully(
          userId,
          deviceId,
          jobId,
        );
        if (cleaned) {
          await this.realtimeStore.manageJob(jobId).delete();
          await this.realtimeStore.dedupDelete(jobId);
        } else {
          await this.realtimeStore.dedupDelete(jobId, deviceId);
        }
      },
    );
  }

  async sweepExpiredPendingAndFallback(
    sendPushFn: (
      userId: string,
      deviceId: string,
      job: RealtimeJob,
    ) => Promise<void>,
    SWEEP_INTERVAL_MS: number,
    GRACE_PERIOD_MS: number,
    MAX_RETRIES = 10,
    batchSize = 200,
    concurrency = 5,
  ) {
    const entries =
      await this.realtimeStore.popExpiredPendingEntries(batchSize);
    if (!entries.length) return;

    const limit = pLimit(concurrency);
    const now = Date.now();

    await Promise.allSettled(
      entries.map((entry) =>
        limit(async () => {
          const [userId, deviceId, jobId] = entry.split('|');
          if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) return;

          await this.redisService.withLock(
            `pending:${userId}:${deviceId}:${jobId}`,
            async () => {
              const pendingIds = await this.realtimeStore.fetchPendingJobIds(
                userId,
                deviceId,
              );
              if (!pendingIds.includes(jobId)) return;

              const job = await this.realtimeStore.manageJob(jobId).get();
              if (!job) {
                await this.realtimeStore.removePendingJob(
                  userId,
                  deviceId,
                  jobId,
                );
                return;
              }

              const { count: attemptCount, timestamp } =
                await this.realtimeStore
                  .attemptCount(userId, deviceId, jobId)
                  .get();

              // Skip retry if job is too recent (less than half sweep interval)
              if (now - timestamp < SWEEP_INTERVAL_MS / 2) return;

              if (attemptCount >= MAX_RETRIES) {
                this.logger.warn(
                  `Max retries (${MAX_RETRIES}) reached for ${jobId} -> ${userId}:${deviceId}`,
                );
                await this.confirmDelivery(jobId, userId, deviceId);
                try {
                  // Final push attempt as a fallback
                  await sendPushFn(userId, deviceId, job);
                } catch (err) {
                  this.logger.error(
                    `Final push failed for ${jobId} -> ${userId}:${deviceId}`,
                    err,
                  );
                }
                return;
              }
              const key = RealtimeKeys.userDevices(userId);
              const activeDevices =
                await this.presenceService.getActiveDevices(key);
              const isDeviceOnline = activeDevices.includes(deviceId);

              try {
                if (isDeviceOnline) {
                  // WS will deliver immediately, just remove pending
                  await this.confirmDelivery(jobId, userId, deviceId);
                  return;
                }

                // Only send push if grace period passed
                if (now - timestamp >= GRACE_PERIOD_MS) {
                  await sendPushFn(userId, deviceId, job);
                  await this.confirmDelivery(jobId, userId, deviceId);
                  return;
                }
              } catch (err) {
                this.logger.warn(
                  `Retry failed for ${jobId} -> ${userId}:${deviceId} (attempt ${attemptCount})`,
                  err,
                );
              }
            },
          );
        }),
      ),
    );
  }
}
