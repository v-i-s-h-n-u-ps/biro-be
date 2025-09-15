import { OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { type Job } from 'bull';

import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { RealtimeJob } from '../interfaces/realtime-job.interface';
import { WebsocketService } from '../services/websocket.service';

export abstract class BaseRealtimeProcessor {
  protected logger = new Logger(this.constructor.name);

  constructor(
    private readonly wsService: WebsocketService,
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
  ) {}

  async process(job: Job<RealtimeJob>) {
    const {
      userIds,
      type,
      title,
      body,
      data,
      websocketRoomIds,
      icon,
      clickAction,
    } = job.data;

    try {
      if (websocketRoomIds?.length) {
        websocketRoomIds.forEach((roomId) => {
          this.wsService.emitToRoom(roomId, type ?? 'GENERAL', data ?? {});
        });
      }

      // 2️⃣ Fetch latest FCM tokens from FirebaseService
      if (userIds.length) {
        const devices =
          await this.userDeviceService.getDevicesByUserIds(userIds);
        const tokens = devices.map((d) => d.deviceToken).filter(Boolean);
        if (tokens.length) {
          await this.firebaseService.sendNotificationToDevices(tokens, {
            notification: {
              title,
              body,
              icon,
              clickAction,
            },
            ...data,
          });
        }
      }

      this.logger.log(`Notification processed successfully: ${type}`);
    } catch (err) {
      this.logger.error(
        `Failed to process notification: ${type}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }

  /** Global failed job handler */
  @OnQueueFailed()
  onFailed(job: Job<RealtimeJob>, error: Error) {
    this.logger.error(
      `Notification job failed (id: ${job.id}, type: ${job.data.type}): ${error.message}`,
      error.stack,
    );
  }
}
