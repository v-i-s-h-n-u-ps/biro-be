// realtime-queue.service.ts
import { Injectable, Logger } from '@nestjs/common';

import { RealtimeKeys } from 'src/common/constants/realtime.keys';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';

import {
  REALTIME_DEDUP_TTL_MS,
  REALTIME_JOB_TTL_SECONDS,
} from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';

@Injectable()
export class RealtimeQueueService {
  private readonly logger = new Logger(RealtimeQueueService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly presence: PresenceService,
  ) {}

  // Store job payload and mark dedup — returns emitted devices if not duplicate
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
      // single global dedup
      const dedupMap = await this.presence.dedupMultiSet(
        job.jobId,
        ['global'],
        REALTIME_DEDUP_TTL_MS,
      );
      if (dedupMap['global']) emittedDevices.push('global');
    }
    if (emittedDevices.length) {
      await this.redis.withTransaction((multi) => {
        multi.set(
          RealtimeKeys.jobKey(job.jobId),
          JSON.stringify(job),
          'EX',
          REALTIME_JOB_TTL_SECONDS,
        );
      });
    }
    return emittedDevices;
  }

  // Add pending record and schedule via zset expiry
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
      REALTIME_JOB_TTL_SECONDS,
    );
    // also add to pending mapping set
    const deviceKey = `${userId}:${deviceId}`;
    await this.redis.client.sadd(
      RealtimeKeys.pendingMapping(job.jobId),
      deviceKey,
    );
  }

  // On reconnect, flush pending jobs for device — emit function is provided by caller
  async flushPendingForDevice(
    userId: string,
    deviceId: string,
    emitToSocketFn: (job: RealtimeJob, socketId: string) => void,
  ) {
    // ... (initial checks unchanged)
    const jobIds = await this.presence.fetchPendingJobIds(userId, deviceId);
    if (!jobIds.length) return;
    const socketId = await this.presence.getSocketForDevice(userId, deviceId);
    if (!socketId) return;
    for (const jobId of jobIds) {
      // Loop without lock; per-job lock inside
      await this.redis.withLock(
        `pending:${userId}:${deviceId}:${jobId}`,
        async () => {
          const deviceKey = `${userId}:${deviceId}`;
          const removed = await this.redis.client.srem(
            RealtimeKeys.pendingMapping(jobId),
            deviceKey,
          );
          if (!removed) return; // already delivered
          const job = await this.presence.getJob(jobId);
          if (!job) {
            await this.presence.removePendingJob(userId, deviceId, jobId);
            return;
          }
          try {
            emitToSocketFn(job, socketId);
            // confirmDelivery called on client ACK, not here
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

  // Called when client ACKs a job
  async confirmDelivery(jobId: string, userId: string, deviceId: string) {
    if (!jobId?.trim() || !userId?.trim() || !deviceId?.trim()) return;
    await this.presence.removePendingJob(userId, deviceId, jobId);
    const deviceKey = `${userId}:${deviceId}`;
    await this.redis.client.srem(RealtimeKeys.pendingMapping(jobId), deviceKey);
    const remaining = await this.redis.client.scard(
      RealtimeKeys.pendingMapping(jobId),
    );
    if (remaining === 0) {
      await this.presence.deleteJob(jobId);
      await this.presence.dedupDelete(jobId); // global cleanup
    } else {
      await this.presence.dedupDelete(jobId, deviceId);
    }
  }

  // Sweep expired pending entries: find expired zset entries and trigger push fallback for them
  async sweepExpiredPendingAndFallback(
    sendPushFn: (
      userId: string,
      deviceId: string,
      job: RealtimeJob,
    ) => Promise<void>,
    batchSize = 200,
  ) {
    const entries = await this.presence.popExpiredPendingEntries(batchSize);
    if (!entries.length) return;
    for (const entry of entries) {
      const [userId, deviceId, jobId] = entry.split('|');
      if (!userId?.trim() || !deviceId?.trim() || !jobId?.trim()) continue;
      await this.redis.withLock(
        `pending:${userId}:${deviceId}:${jobId}`,
        async () => {
          // Re-check if still pending (flush might have raced)
          const pendingIds = await this.presence.fetchPendingJobIds(
            userId,
            deviceId,
          );
          if (!pendingIds.includes(jobId)) return;
          const activeDevices = await this.presence.getActiveDevices(userId);
          const isDeviceOnline = activeDevices.includes(deviceId);
          if (isDeviceOnline) return; // Reconnected; let flush handle
          const job = await this.presence.getJob(jobId);
          if (!job) return;
          try {
            await sendPushFn(userId, deviceId, job);
            await this.confirmDelivery(jobId, userId, deviceId); // Confirm after push
          } catch (err) {
            this.logger.error(
              `Push failed for ${jobId} -> ${userId}:${deviceId}`,
              err,
            );
          } finally {
            // Always clean up
            await this.presence.removePendingJob(userId, deviceId, jobId);
            const deviceKey = `${userId}:${deviceId}`;
            await this.redis.client.srem(
              RealtimeKeys.pendingMapping(jobId),
              deviceKey,
            );
            if (
              (await this.redis.client.scard(
                RealtimeKeys.pendingMapping(jobId),
              )) === 0
            ) {
              await this.presence.deleteJob(jobId);
              await this.presence.dedupDelete(jobId);
            }
          }
        },
      );
    }
  }
}
