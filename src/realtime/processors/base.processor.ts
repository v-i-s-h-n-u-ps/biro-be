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
      await this.firebaseService.sendNotificationToDevices(tokens, payload);
    }
  }

  async process(job: Job<RealtimeJob>) {
    const { userIds, event, payload, websocketRoomIds, options, namespace } =
      job.data;
    const { data, ...notification } = payload;

    const { strategy, emitToRoom, emitToUser } = options;

    try {
      switch (strategy) {
        case DeliveryStrategy.WS_ONLY: {
          if (websocketRoomIds.length && emitToRoom) {
            websocketRoomIds.forEach((roomId) => {
              this.wsService.emitToRoom(namespace, roomId, event, data ?? {});
            });
          }
          if (emitToUser && !userIds.length) {
            for (const uid of userIds) {
              await this.wsService.emitToUser(
                namespace,
                uid,
                event,
                data ?? {},
              );
            }
          }
          break;
        }
        case DeliveryStrategy.PUSH_ONLY: {
          await this.sendPush(userIds, {
            notification,
            ...data,
          });
          break;
        }
        case DeliveryStrategy.WS_THEN_PUSH: {
          const offlineUserIds: string[] = [];

          if (websocketRoomIds.length && emitToRoom) {
            websocketRoomIds.forEach((roomId) => {
              this.wsService.emitToRoom(namespace, roomId, event, data ?? {});
            });
          }
          if (emitToUser) {
            for (const uid of userIds) {
              const sockets = await this.presenceService.getActiveSockets(uid);

              if (sockets.length) {
                // Online → emit to all connected devices
                await this.wsService.emitToUser(
                  namespace,
                  uid,
                  event,
                  data ?? {},
                );
              } else {
                // Offline → fallback to push
                offlineUserIds.push(uid);
              }
            }
          }

          if (offlineUserIds.length) {
            await this.sendPush(offlineUserIds, {
              notification,
              ...data,
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
