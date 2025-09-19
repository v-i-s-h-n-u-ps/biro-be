import { OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { type Job } from 'bull';
import { MessagingPayload } from 'firebase-admin/messaging';

import { DeliveryStrategy } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { RealtimeJob } from '../interfaces/realtime-job.interface';
import { WebsocketService } from '../services/websocket.service';

export abstract class BaseRealtimeProcessor {
  protected logger = new Logger(this.constructor.name);

  constructor(
    private readonly wsService: WebsocketService,
    private readonly presenceService: PresenceService,
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
  ) {}

  private async sendPush(userIds: string[], payload: MessagingPayload) {
    if (!userIds.length) return;
    const devices = await this.userDeviceService.getDevicesByUserIds(userIds);
    const tokens = devices.map((d) => d.deviceToken).filter(Boolean);
    if (tokens.length) {
      if (tokens.length === 1) {
        await this.firebaseService.sendNotificationToDevice(tokens[0], payload);
      } else {
        await this.firebaseService.sendNotificationToDevices(tokens, payload);
      }
    }
  }

  private async emitToWs(job: RealtimeJob) {
    const { userIds, event, payload, websocketRoomIds, options, namespace } =
      job;
    const { data = {}, wsData = {}, pushData: _, ...notification } = payload;
    const wsDataFinal = { ...data, ...wsData, ...notification };

    if (websocketRoomIds.length && options.emitToRoom) {
      websocketRoomIds.forEach((roomId) =>
        this.wsService.emitToRoom(namespace, roomId, event, wsDataFinal),
      );
    }
    if (options.emitToUser && userIds.length) {
      await Promise.all(
        userIds.map((uid) =>
          this.wsService.emitToUser(namespace, uid, event, wsDataFinal),
        ),
      );
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
          await this.sendPush(userIds, {
            notification,
            data: pushFinal,
          });
          break;
        }
        case DeliveryStrategy.WS_THEN_PUSH: {
          await this.emitToWs(job.data);

          const offlineUserIds: string[] = [];
          if (emitToUser) {
            for (const uid of userIds) {
              const sockets = await this.presenceService.getActiveSockets(uid);
              if (!sockets.length) offlineUserIds.push(uid);
            }
          }
          if (offlineUserIds.length) {
            await this.sendPush(offlineUserIds, {
              notification,
              data: pushFinal,
            });
          }

          break;
        }
        default:
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
