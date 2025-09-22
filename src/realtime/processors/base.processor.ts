import { OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { type Job } from 'bull';
import { MessagingPayload } from 'firebase-admin/messaging';

import { DeliveryStrategy } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { REALTIME_DEDUP_TTL_MS } from '../constants/realtime.constants';
import { RealtimeJob } from '../interfaces/realtime-job.interface';
import { RealtimeQueueService } from '../services/realtime-queue.service';
import { RealtimeStoreService } from '../services/realtime-store.service';
import { WebsocketService } from '../services/websocket.service';
import { getNotificationPayload } from '../utils/payload.helper';

export abstract class BaseRealtimeProcessor {
  protected logger = new Logger(this.constructor.name);

  constructor(
    private readonly wsService: WebsocketService,
    private readonly presenceService: PresenceService,
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
    private readonly queueService: RealtimeQueueService,
    private readonly realtimeStore: RealtimeStoreService,
  ) {}

  private async sendPush(deviceIds: string[], payload: MessagingPayload) {
    await this.firebaseService.sendNotificationToDevices(deviceIds, payload);
  }

  private dedupeArray<T>(arr?: T[]): T[] {
    return arr ? Array.from(new Set(arr)) : [];
  }
  protected async emitToWs(job: RealtimeJob) {
    job.userIds = this.dedupeArray(job.userIds);

    const { userIds = [], roomId, event, options, namespace } = job;

    const { wsPayload } = getNotificationPayload(job);

    // --- Emit to rooms ---
    if (options.emitToRoom && roomId) {
      const isNew = await this.realtimeStore.dedupSet(
        job.jobId,
        'global',
        REALTIME_DEDUP_TTL_MS * 0.5,
      );
      if (!isNew) return;

      try {
        this.wsService.emitToRoom(namespace, roomId, event, wsPayload);
      } catch (err) {
        this.logger.error(`emitToRoom failed for room ${roomId}`, err);
      }
    }

    // --- Emit per-user per-device ---
    if (options.emitToUser && userIds.length) {
      for (const userId of userIds) {
        const devices = await this.userDeviceService.getDevicesByUserIds([
          userId,
        ]);
        const deviceIds = devices.map((d) => d.deviceToken);
        if (!deviceIds.length) continue;

        const dedupMap = await this.realtimeStore.dedupMultiSet(
          job.jobId,
          deviceIds,
          REALTIME_DEDUP_TTL_MS,
        );
        const emittedDevices = deviceIds.filter((id) => dedupMap[id]);
        if (!emittedDevices.length) continue;

        for (const deviceId of emittedDevices) {
          await this.queueService.addPendingForDevice(userId, deviceId, job);

          try {
            if (!job.roomId) {
              const socketId = await this.presenceService.getSocketForDevice(
                userId,
                deviceId,
              );
              if (!socketId) continue;

              this.wsService.emitToSocket(
                namespace,
                socketId,
                event,
                wsPayload,
              );
            } else {
              const activeRoom = await this.presenceService.getActiveRoom(
                userId,
                deviceId,
              );
              if (activeRoom !== job.roomId) continue;

              const socketId = await this.presenceService.getSocketForDevice(
                userId,
                deviceId,
              );
              if (!socketId) continue;

              this.wsService.emitToSocket(
                namespace,
                socketId,
                event,
                wsPayload,
              );
            }
          } catch (err) {
            this.logger.error(
              `emitToSocket failed for ${userId}:${deviceId}`,
              err,
            );
          }
        }
      }
    }
  }

  async process(job: Job<RealtimeJob>) {
    const { userIds, event, options } = job.data;
    const { strategy } = options;

    const { pushData: pushPayload, notification } = getNotificationPayload(
      job.data,
    );
    try {
      switch (strategy) {
        case DeliveryStrategy.WS_ONLY: {
          await this.emitToWs(job.data);
          break;
        }
        case DeliveryStrategy.PUSH_ONLY: {
          for (const userId of userIds) {
            const devices = await this.userDeviceService.getDevicesByUserIds([
              userId,
            ]);
            const deviceIds = devices.map((d) => d.deviceToken);

            const dedupMap = await this.realtimeStore.dedupMultiSet(
              job.data.jobId,
              deviceIds,
              REALTIME_DEDUP_TTL_MS,
            );

            // Keep only dedup-passing tokens
            const dedupedDeviceIds = deviceIds.filter((id) => dedupMap[id]);

            if (dedupedDeviceIds.length > 0) {
              await this.sendPush(dedupedDeviceIds, {
                notification,
                data: pushPayload,
              });
            }
          }
          break;
        }
        case DeliveryStrategy.WS_THEN_PUSH: {
          await this.emitToWs(job.data);
          break;
        }
        default:
          await this.emitToWs(job.data);
          break;
      }
    } catch (err) {
      this.logger.error(
        `Failed to process notification: ${event}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }

  /** Global failed job handler */
  @OnQueueFailed()
  onFailed(job: Job<RealtimeJob>, error: Error) {
    this.logger.error(
      `Notification job failed (id: ${job.id}, event: ${job.data.event}): ${error.message}`,
      error.stack,
    );
  }
}
