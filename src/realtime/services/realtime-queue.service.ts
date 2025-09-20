// realtime-queue.service.ts
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

@Injectable()
export class RealtimeQueueService {
  private readonly logger = new Logger(RealtimeQueueService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly presence: PresenceService,
  ) {}

  async storeJobWithDedup(
    job: RealtimeJob,
    deviceIds?: string[],
  ): Promise<string[]> {
    if (!job.jobId?.trim()) return [];
    const emittedDevices: string[] = [];
    if (deviceIds?.length) {
      deviceIds = deviceIds.filter((id) => id?.trim());
      const dedupMap = await this.presence.dedupMultiSet(
        job.jobId,
        deviceIds,
        REALTIME_DEDUP_TTL_MS,
      );
      emittedDevices.push(...deviceIds.filter((id) => dedupMap[id]));
    } else {
      const dedupMap = await this.presence.dedupMultiSet(
        job.jobId,
        ['global'],
        REALTIME_DEDUP_TTL_MS,
      );
      if (dedupMap['global']) emittedDevices.push('global');
    }
    if (emittedDevices.length) {
      try {
        await this.redis.withTransaction((multi) => {
          multi.set(
            RealtimeKeys.jobKey(job.jobId),
            JSON.stringify(job),
            'EX',
            REALTIME_JOB_TTL_SECONDS,
          );
        });
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
    await this.presence.addPendingJob(
      userId,
      deviceId,
      job.jobId,
      REALTIME_PENDING_TTL_SECONDS,
    );
    const deviceKey = `${userId}:${deviceId}`;
    await this.redis.client.sadd(
      RealtimeKeys.pendingMapping(job.jobId),
      deviceKey,
    );
    await this.redis.client.expire(
      RealtimeKeys.pendingMapping(job.jobId),
      REALTIME_JOB_TTL_SECONDS * 1.5,
    );
  }

  async flushPendingForDevice(
    userId: string,
    deviceId: string,
    emitToSocketFn: (job: RealtimeJob, socketId: string) => void,
  ) {
    const jobIds = await this.presence.fetchPendingJobIds(userId, deviceId);
    if (!jobIds.length) return;
    const socketId = await this.presence.getSocketForDevice(userId, deviceId);
    if (!socketId) return;
    for (const jobId of jobIds) {
      await this.redis.withLock(
        `pending:${userId}:${deviceId}:${jobId}`,
        async () => {
          const deviceKey = `${userId}:${deviceId}`;
          const removed = await this.redis.client.srem(
            RealtimeKeys.pendingMapping(jobId),
            deviceKey,
          );
          if (!removed) return;
          const job = await this.presence.getJob(jobId);
          if (!job) {
            await this.presence.removePendingJob(userId, deviceId, jobId);
            return;
          }
          try {
            emitToSocketFn(job, socketId);
          } catch (err) {
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
    await this.redis.withLock(
      `pending:${userId}:${deviceId}:${jobId}`,
      async () => {
        await this.presence.removePendingJob(userId, deviceId, jobId);
        const deviceKey = `${userId}:${deviceId}`;
        await this.redis.client.srem(
          RealtimeKeys.pendingMapping(jobId),
          deviceKey,
        );
        const lua = `
        local key = KEYS[1]
        if redis.call('SCARD', key) == 0 then
          redis.call('DEL', key)
          return 1
        end
        return 0
      `;
        const shouldCleanup = await this.redis.client.eval(
          lua,
          1,
          RealtimeKeys.pendingMapping(jobId),
        );
        if (shouldCleanup) {
          await this.presence.deleteJob(jobId);
          await this.presence.dedupDelete(jobId);
        } else {
          await this.presence.dedupDelete(jobId, deviceId);
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
    batchSize = 200,
    concurrency = 5,
  ) {
    const entries = await this.presence.popExpiredPendingEntries(batchSize);
    if (!entries.length) return;

    const limit = pLimit(concurrency);

    await Promise.allSettled(
      entries.map((entry) =>
        limit(async () => {
          const [userId, deviceId, jobId] = entry.split('|');
          if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) return;

          await this.redis.withLock(
            `pending:${userId}:${deviceId}:${jobId}`,
            async () => {
              const pendingIds = await this.presence.fetchPendingJobIds(
                userId,
                deviceId,
              );
              if (!pendingIds.includes(jobId)) return;

              const activeDevices =
                await this.presence.getActiveDevices(userId);
              const isDeviceOnline = activeDevices.includes(deviceId);
              if (isDeviceOnline) return;

              const job = await this.presence.getJob(jobId);
              if (!job) return;

              const hashKey = RealtimeKeys.devicePendingHash(userId, deviceId);
              const attemptData = await this.redis.client.hget(hashKey, jobId);
              let attemptCount = 0;
              if (attemptData) {
                const [count] = attemptData.split('|');
                attemptCount = parseInt(count) || 0;
              }
              if (attemptCount >= 10) {
                this.logger.warn(
                  `Max retries (10) reached for ${jobId} -> ${userId}:${deviceId}`,
                );
                await this.presence.removePendingJob(userId, deviceId, jobId);
                await this.redis.client.srem(
                  RealtimeKeys.pendingMapping(jobId),
                  `${userId}:${deviceId}`,
                );
                return;
              }

              try {
                await sendPushFn(userId, deviceId, job);
                await this.confirmDelivery(jobId, userId, deviceId);

                const lua = `
                local mappingKey = KEYS[1]
                local jobKey = KEYS[2]
                local jobId = ARGV[1]
                local device = ARGV[2]
                redis.call('SREM', mappingKey, device)
                if redis.call('SCARD', mappingKey) == 0 then
                  redis.call('DEL', jobKey)
                end
                return 1
              `;
                const mappingKey = RealtimeKeys.pendingMapping(jobId);
                const jobKey = RealtimeKeys.jobKey(jobId);
                const deviceKey = `${userId}:${deviceId}`;
                await this.redis.client.eval(
                  lua,
                  2,
                  mappingKey,
                  jobKey,
                  jobId,
                  deviceKey,
                );

                await this.presence.removePendingJob(userId, deviceId, jobId);
              } catch (err) {
                await this.redis.client.hset(
                  hashKey,
                  jobId,
                  `${attemptCount + 1}|${attemptData?.split('|')[1] || Date.now()}`,
                );
                this.logger.warn(
                  `Push failed for ${jobId} -> ${userId}:${deviceId} (attempt ${attemptCount + 1})`,
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
