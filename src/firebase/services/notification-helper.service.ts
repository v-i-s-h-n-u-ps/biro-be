import { Injectable, Logger } from '@nestjs/common';

import { NotificationPayload } from '../interfaces/notification-payload.interface';

import { FirebaseService } from './firebase.service';

@Injectable()
export class NotificationHelperService {
  private readonly logger = new Logger(NotificationHelperService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Send notification to a single device token
   */
  async sendToDevice(deviceToken: string, payload: NotificationPayload) {
    try {
      await this.firebaseService.sendNotificationToDevice(deviceToken, {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || undefined,
          clickAction: payload.clickAction || undefined,
        },
        data: payload.data ?? {},
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(`Failed to send notification to device: ${message}`);
    }
  }

  /**
   * Send notification to multiple device tokens
   */
  async sendToDevices(deviceTokens: string[], payload: NotificationPayload) {
    if (deviceTokens.length === 0) return;

    try {
      await this.firebaseService.sendNotificationToDevices(deviceTokens, {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(`Failed to send notification to devices: ${message}`);
    }
  }

  /**
   * Generate notification payload for chat messages
   */
  createChatNotification(
    title: string,
    body: string,
    chatId: string,
  ): NotificationPayload {
    return {
      title,
      body,
      data: { type: 'chat', chatId },
    };
  }

  /**
   * Generate notification payload for events / rides
   */
  createEventNotification(
    title: string,
    body: string,
    eventId: string,
  ): NotificationPayload {
    return {
      title,
      body,
      data: { type: 'event', eventId },
    };
  }

  /**
   * Generate notification payload for follow/unfollow
   */
  createFollowNotification(
    title: string,
    body: string,
    userId: string,
  ): NotificationPayload {
    return {
      title,
      body,
      data: { type: 'follow', userId },
    };
  }
}
