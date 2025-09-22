import { Injectable, Logger } from '@nestjs/common';
import pLimit from 'p-limit';

import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';

import {
  REALTIME_DEDUP_TTL_MS,
  REALTIME_JOB_TTL_SECONDS,
  REALTIME_PENDING_TTL_SECONDS,
  REDIS_LOCK_TTL_MS,
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
    const socketId = await this.presenceService.getSocketForDevice(
      userId,
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
            let canEmit = false;

            if (!job.roomId) {
              // user-level job → always emit
              canEmit = true;
            } else {
              // room-level job → check device active room
              const activeRoom = await this.presenceService.getActiveRoom(
                userId,
                deviceId,
              );
              canEmit = activeRoom === job.roomId;
            }

            if (canEmit) {
              emitToSocketFn(job, socketId);
              await this.confirmDelivery(jobId, userId, deviceId);
            }

            // --- Mark as delivered ---
            await this.realtimeStore
              .attemptCount(userId, deviceId, jobId)
              .increment();
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
        REDIS_LOCK_TTL_MS,
      );
    }
  }

  async handleJobFailure(jobId: string, error: Error): Promise<void> {
    this.logger.error(`Job ${jobId} failed permanently:`, error);

    try {
      const cleanedCount = await this.realtimeStore.cleanupFailedJob(jobId);
      this.logger.log(
        `Cleaned up ${cleanedCount} pending entries for failed job ${jobId}`,
      );
    } catch (cleanupError) {
      this.logger.error(
        `Failed to cleanup job ${jobId} after failure:`,
        cleanupError,
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
      REDIS_LOCK_TTL_MS,
    );
  }

  async sweepExpiredPendingAndFallback(
    sendPushFn: (
      userId: string,
      deviceIds: string[],
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

    // Group by userId + jobId
    const grouped = new Map<
      string,
      { userId: string; jobId: string; deviceIds: string[] }
    >();

    for (const entry of entries) {
      const [userId, deviceId, jobId] = entry.split('|');
      if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) continue;

      const key = `${userId}|${jobId}`;
      if (!grouped.has(key)) {
        grouped.set(key, { userId, jobId, deviceIds: [] });
      }
      grouped.get(key).deviceIds.push(deviceId);
    }

    await Promise.allSettled(
      Array.from(grouped.values()).map(({ userId, jobId, deviceIds }) =>
        limit(async () => {
          const job = await this.realtimeStore.manageJob(jobId).get();
          if (!job) {
            // Clean up stale pending entries
            await Promise.all(
              deviceIds.map((deviceId) =>
                this.realtimeStore.removePendingJob(userId, deviceId, jobId),
              ),
            );
            return;
          }

          // Use the first device to check attempt/timestamp (all belong to same jobId)
          const firstDeviceId = deviceIds[0];
          const { count: attemptCount, timestamp } = await this.realtimeStore
            .attemptCount(userId, firstDeviceId, jobId)
            .get();

          // Skip retry if job is too recent
          if (now - timestamp < SWEEP_INTERVAL_MS / 2) return;

          if (attemptCount >= MAX_RETRIES) {
            this.logger.warn(
              `Max retries (${MAX_RETRIES}) reached for ${jobId} -> ${userId} [${deviceIds.join(',')}]`,
            );

            await Promise.all(
              deviceIds.map((deviceId) =>
                this.confirmDelivery(jobId, userId, deviceId),
              ),
            );

            try {
              await sendPushFn(userId, deviceIds, job); // 👈 now batched per jobId
            } catch (err) {
              this.logger.error(
                `Final push failed for ${jobId} -> ${userId} [${deviceIds.join(',')}]`,
                err,
              );
            }
            return;
          }

          const activeDevices =
            await this.presenceService.getActiveDevices(userId);

          for (const deviceId of deviceIds) {
            const isDeviceOnline = activeDevices.includes(deviceId);

            try {
              if (isDeviceOnline) {
                const activeRoom = await this.presenceService.getActiveRoom(
                  userId,
                  deviceId,
                );
                const isInRoom =
                  job.roomId == null || activeRoom === job.roomId;

                if (isInRoom) {
                  await this.confirmDelivery(jobId, userId, deviceId);
                } else {
                  if (job.roomId == null) {
                    await sendPushFn(userId, deviceIds, job);
                    for (const d of deviceIds) {
                      await this.confirmDelivery(jobId, userId, d);
                    }
                  } else {
                    // 🎯 Room-specific job → push only to this device
                    await sendPushFn(userId, [deviceId], job);
                    await this.confirmDelivery(jobId, userId, deviceId);
                  }
                }

                continue;
              }

              // Only send push if grace period passed
              if (now - timestamp >= GRACE_PERIOD_MS) {
                await sendPushFn(userId, [deviceId], job);
                await this.confirmDelivery(jobId, userId, deviceId);
              }
            } catch (err) {
              this.logger.warn(
                `Retry failed for ${jobId} -> ${userId}:${deviceId} (attempt ${attemptCount})`,
                err,
              );
            }
          }
        }),
      ),
    );
  }
}
