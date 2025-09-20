// src/realtime/realtime-queue.service.ts
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

  // Store job payload and mark dedup — returns false if duplicate (already seen recently)
  async storeJobWithDedup(
    job: RealtimeJob,
    deviceIds?: string[],
  ): Promise<string[]> {
    const emittedDevices: string[] = [];

    if (deviceIds?.length) {
      const dedupMap = await this.presence.dedupMultiSet(
        job.jobId,
        deviceIds,
        REALTIME_DEDUP_TTL_MS,
      );
      emittedDevices.push(...deviceIds.filter((id) => dedupMap[id]));
    } else {
      // single global dedup
      const isSet = await this.presence.dedupMultiSet(
        job.jobId,
        ['global'],
        REALTIME_DEDUP_TTL_MS,
      );
      if (isSet['global']) emittedDevices.push('global');
    }

    await this.redis.withTransaction((multi) => {
      multi.set(
        RealtimeKeys.jobKey(job.jobId),
        JSON.stringify(job),
        'EX',
        REALTIME_JOB_TTL_SECONDS,
      );
    });

    return emittedDevices;
  }

  // Add pending record and schedule via zset expiry
  async addPendingForDevice(
    userId: string,
    deviceId: string,
    job: RealtimeJob,
  ) {
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
  // emitFn(job, socketId) should be used to emit to the currently connected socket
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
      const deviceKey = `${userId}:${deviceId}`;
      const removed = await this.redis.client.srem(
        RealtimeKeys.pendingMapping(jobId),
        deviceKey,
      );
      if (!removed) continue; // already delivered by another path

      const job = await this.presence.getJob(jobId);
      if (!job) {
        await this.presence.removePendingJob(userId, deviceId, jobId);
        continue;
      }

      try {
        emitToSocketFn(job, socketId);
      } catch (err) {
        this.logger.error(
          `emit-to-socket failed for ${userId}:${deviceId} job ${jobId}`,
          err,
        );
      }
    }
  }

  // Called when client ACKs a job
  async confirmDelivery(jobId: string, userId: string, deviceId: string) {
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
  // This will be invoked by the PendingSweepProcessor (a repeatable Bull job)
  async sweepExpiredPendingAndFallback(
    sendPushFn: (userId: string, job: RealtimeJob) => Promise<void>,
    batchSize = 200,
  ) {
    const entries = await this.presence.popExpiredPendingEntries(batchSize);
    if (!entries.length) return;

    for (const entry of entries) {
      const [userId, deviceId, jobId] = entry.split('|');
      const deviceKey = `${userId}:${deviceId}`;

      const isDeviceOnline =
        (await this.presence.getActiveDevices(userId)).length > 0;
      if (!isDeviceOnline) {
        const job = await this.presence.getJob(jobId);
        if (job) {
          try {
            await sendPushFn(userId, job);
          } catch (err) {
            this.logger.error(
              `Push fallback failed for ${jobId} -> ${userId}:${deviceId}`,
              err,
            );
          }
        }
      }

      await this.presence.removePendingJob(userId, deviceId, jobId);
      await this.redis.client.srem(
        RealtimeKeys.pendingMapping(jobId),
        deviceKey,
      );

      if (
        (await this.redis.client.scard(RealtimeKeys.pendingMapping(jobId))) ===
        0
      ) {
        await this.presence.deleteJob(jobId);
        await this.presence.dedupDelete(jobId);
      }
    }
  }
}
