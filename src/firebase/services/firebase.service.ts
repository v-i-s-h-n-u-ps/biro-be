import { Inject, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { eventPriorityMap } from 'src/common/constants/message-priority.constant';
import { NotificationEvents } from 'src/common/constants/notification-events.enum';

type NotificationOptions =
  | {
      type: 'silent' | 'normal';
      activityId?: undefined;
    }
  | { type: 'live'; activityId: string };

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
  ) {}

  /**
   * Verify Firebase ID token and return decoded payload
   */
  async verify(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.firebaseAdmin.auth().verifyIdToken(idToken);
  }

  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return this.firebaseAdmin.auth().getUser(uid);
  }

  private getNotificationPayload(
    payload: admin.messaging.MessagingPayload,
    options: NotificationOptions,
  ) {
    const { notification = {}, data = {} } = payload;
    const { type, activityId } = options;

    const priority =
      eventPriorityMap[data.event as NotificationEvents] ?? 'high';

    const message: Omit<admin.messaging.Message, 'token'> = {
      data,
      android: { priority, notification: {} },
      apns: {
        headers: { 'apns-priority': priority === 'high' ? '10' : '5' },
        payload: { aps: {} },
      },
    };

    switch (type) {
      case 'silent':
        break;
      case 'normal':
        message.notification = notification;
        message.android!.notification = {
          sound: 'default',
          channelId: 'default',
        };
        message.apns!.payload!.aps = { sound: 'default' };
        break;
      case 'live':
        message.notification = notification;
        message.data = { ...data, activityId, type: 'live-activity' };
        message.android!.notification = {
          sound: 'default',
          channelId: 'default',
          ...(type === 'live' ? { ongoing: true } : {}),
        };
        message.apns!.payload!.aps = { sound: 'default', 'mutable-content': 1 };
        break;
    }

    return message;
  }

  /**
   * Send a notification to a single device
   */
  async sendNotificationToDevice(
    token: string,
    payload: admin.messaging.MessagingPayload,
    options: NotificationOptions = { type: 'normal' },
  ) {
    const message = this.getNotificationPayload(payload, options);
    try {
      await this.firebaseAdmin.messaging().send({ ...message, token });
    } catch (err) {
      this.logger.error(`Failed to send notification: ${err}`);
    }
  }

  /**
   * Send a notification to multiple devices
   */
  async sendNotificationToDevices(
    tokens: string[],
    payload: admin.messaging.MessagingPayload,
    options: NotificationOptions = { type: 'normal' },
  ) {
    if (tokens.length === 0) return;
    const message = this.getNotificationPayload(payload, options);
    try {
      const response = await this.firebaseAdmin
        .messaging()
        .sendEachForMulticast({ ...message, tokens });

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.logger.warn(
            `Failed to send to token ${tokens[idx]}: ${resp.error?.message}`,
          );
        }
      });
    } catch (err) {
      this.logger.error(`Failed to send multicast notification: ${err}`);
    }
  }

  /**
   * Optionally create a custom Firebase token for the user
   */
  async createCustomToken(uid: string): Promise<string> {
    return this.firebaseAdmin.auth().createCustomToken(uid);
  }

  /**
   * Revoke refresh tokens for a user
   */
  async revokeTokens(uid: string) {
    await this.firebaseAdmin.auth().revokeRefreshTokens(uid);
  }
}
