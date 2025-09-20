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
import { WebsocketService } from '../services/websocket.service';

export abstract class BaseRealtimeProcessor {
  protected logger = new Logger(this.constructor.name);

  constructor(
    private readonly wsService: WebsocketService,
    private readonly presenceService: PresenceService,
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
    private readonly queueService: RealtimeQueueService,
  ) {}

  private async sendPush(
    userId: string,
    deviceId: string,
    payload: MessagingPayload,
  ) {
    const devices = await this.userDeviceService.getDevicesByUserIds([userId]);
    const token = devices.find((d) => d.deviceToken === deviceId)?.deviceToken;
    if (!token) return;
    await this.firebaseService.sendNotificationToDevice(token, payload);
  }

  private dedupeArray<T>(arr?: T[]): T[] {
    return arr ? Array.from(new Set(arr)) : [];
  }

  protected async emitToWs(job: RealtimeJob) {
    job.userIds = this.dedupeArray(job.userIds);
    job.websocketRoomIds = this.dedupeArray(job.websocketRoomIds);
    const { userIds, websocketRoomIds, event, payload, options, namespace } =
      job;
    // --- Emit to rooms ---
    if (options.emitToRoom && websocketRoomIds.length) {
      // Add global dedup for rooms
      const isNew = await this.presenceService.dedupSet(
        job.jobId,
        'global',
        REALTIME_DEDUP_TTL_MS,
      );
      if (!isNew) return;
      for (const roomId of websocketRoomIds) {
        try {
          this.wsService.emitToRoom(namespace, roomId, event, payload);
        } catch (err) {
          this.logger.error(`emitToRoom failed for room ${roomId}`, err);
        }
      }
    }
    // --- Emit per-user per-device ---
    if (options.emitToUser && userIds.length) {
      for (const userId of userIds) {
        const deviceIds = await this.presenceService.getActiveDevices(userId);
        if (!deviceIds.length) continue;
        const dedupMap = await this.presenceService.dedupMultiSet(
          job.jobId,
          deviceIds,
          REALTIME_DEDUP_TTL_MS,
        );
        const emittedDevices = deviceIds.filter((id) => dedupMap[id]);
        if (!emittedDevices.length) continue;
        for (const deviceId of emittedDevices) {
          await this.queueService.addPendingForDevice(userId, deviceId, job);
          const socketId = await this.presenceService.getSocketForDevice(
            userId,
            deviceId,
          );
          if (!socketId) continue;
          const emitPayload = {
            ...payload,
            wsData: { ...payload.wsData, jobId: job.jobId },
          };
          try {
            this.wsService.emitToSocket(
              namespace,
              socketId,
              event,
              emitPayload,
            );
          } catch (err) {
            this.logger.error(
              `emitToSocket failed for ${userId}:${deviceId}`,
              err,
            );
            if (
              [
                DeliveryStrategy.WS_THEN_PUSH,
                DeliveryStrategy.PUSH_ONLY,
              ].includes(job.options.strategy)
            ) {
              const {
                data = {},
                pushData = {},
                wsData: _,
                ...notification
              } = payload;
              const pushFinal = { ...data, ...pushData, event };
              await this.sendPush(userId, deviceId, {
                notification,
                data: pushFinal,
              });
              await this.queueService.confirmDelivery(
                job.jobId,
                userId,
                deviceId,
              );
            }
          }
        }
      }
    }
  }

  async process(job: Job<RealtimeJob>) {
    const { userIds, event, payload, options } = job.data;
    const { data = {}, wsData: _, pushData = {}, ...notification } = payload;
    const { strategy, emitToUser } = options;
    const pushFinal = { ...data, ...pushData, event };
    try {
      switch (strategy) {
        case DeliveryStrategy.WS_ONLY: {
          await this.emitToWs(job.data);
          break;
        }
        case DeliveryStrategy.PUSH_ONLY: {
          for (const userId of userIds) {
            const deviceIds =
              await this.presenceService.getActiveDevices(userId);
            const dedupMap = await this.presenceService.dedupMultiSet(
              job.data.jobId,
              deviceIds,
              REALTIME_DEDUP_TTL_MS,
            );
            for (const deviceId of deviceIds.filter((id) => dedupMap[id])) {
              await this.sendPush(userId, deviceId, {
                notification,
                data: pushFinal,
              });
            }
          }
          break;
        }
        case DeliveryStrategy.WS_THEN_PUSH: {
          await this.emitToWs(job.data);
          const offlineDevices: { userId: string; deviceId: string }[] = [];
          if (emitToUser) {
            for (const uid of userIds) {
              const activeDevices =
                await this.presenceService.getActiveDevices(uid);
              const allDevices =
                await this.userDeviceService.getDevicesByUserIds([uid]);
              for (const dev of allDevices) {
                if (!activeDevices.includes(dev.deviceToken)) {
                  offlineDevices.push({
                    userId: uid,
                    deviceId: dev.deviceToken,
                  });
                }
              }
            }
          }
          for (const { userId, deviceId } of offlineDevices) {
            const isNew = await this.presenceService.dedupSet(
              job.data.jobId,
              deviceId,
              REALTIME_DEDUP_TTL_MS,
            );
            if (!isNew) continue;
            await this.sendPush(userId, deviceId, {
              notification,
              data: pushFinal,
            });
          }
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
