import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Queue } from 'bull';
import * as admin from 'firebase-admin';

import { QueueName } from 'src/common/constants/common.enum';
import { eventPriorityMap } from 'src/common/constants/message-priority.constant';
import { NotificationEvents } from 'src/common/constants/notification-events.enum';

import {
  FIREBASE_BATCH_SIZE,
  FIREBASE_DELIVERY_ATTEMPTS,
  FIREBASE_DELIVERY_BACKOFF_MS,
} from '../constants/firebase-queue.constant';
import {
  FirebaseDeliveryJob,
  FirebaseDeliveryResult,
} from '../interfaces/firebase-delivery.interface';

type NotificationOptions =
  | {
      type: 'silent' | 'normal';
      activityId?: undefined;
    }
  | { type: 'live'; activityId: string };

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly maxBatchSize = FIREBASE_BATCH_SIZE;

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: typeof admin,
    @InjectQueue(QueueName.FIREBASE_DELIVERY)
    private readonly firebaseQueue: Queue<FirebaseDeliveryJob>,
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
        message.android.notification = {
          sound: 'default',
          channelId: 'default',
        };
        message.apns.payload.aps = { sound: 'default' };
        break;
      case 'live':
        message.notification = notification;
        message.data = { ...data, activityId, type: 'live-activity' };
        message.android.notification = {
          sound: 'default',
          channelId: 'default',
          ...(type === 'live' ? { ongoing: true } : {}),
        };
        message.apns.payload.aps = { sound: 'default', 'mutable-content': 1 };
        break;
    }

    return message;
  }

  isRetryableError(error: admin.FirebaseError): boolean {
    const retryableCodes = [
      'messaging/device-token-not-registered',
      'messaging/invalid-argument',
      'messaging/internal-error',
      'messaging/server-unavailable',
      'messaging/too-many-requests',
    ];

    const errorCode = error?.code;
    return retryableCodes.includes(errorCode);
  }

  private async deliverBatch(
    tokens: string[],
    payload: admin.messaging.MessagingPayload,
    options: NotificationOptions,
  ): Promise<FirebaseDeliveryResult> {
    const message = this.getNotificationPayload(payload, options);
    const result: FirebaseDeliveryResult = {
      successfulTokens: [],
      failedTokens: [],
      attempt: 1,
    };

    try {
      const response = await this.firebaseAdmin
        .messaging()
        .sendEachForMulticast({ ...message, tokens });

      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          result.successfulTokens.push(tokens[idx]);
        } else {
          result.failedTokens.push({
            token: tokens[idx],
            error: resp.error,
          });
          this.logger.warn(
            `Failed to send to token ${tokens[idx]}: ${resp.error?.message}`,
          );
        }
      });
    } catch (err: unknown) {
      this.logger.error(`Batch delivery failed: `, err);
      // Mark all as failed if batch operation fails
      tokens.forEach((token) => {
        result.failedTokens.push({ token, error: err as admin.FirebaseError });
      });
    }

    return result;
  }

  async queueFirebaseDelivery(
    token: string | string[],
    payload: admin.messaging.MessagingPayload,
    jobId: string,
    options: NotificationOptions = { type: 'normal' },
  ) {
    const tokens = Array.isArray(token) ? token : [token];
    const jobData: FirebaseDeliveryJob = {
      jobId,
      tokens,
      payload,
      options,
      attempt: 1,
      createdAt: Date.now(),
    };

    const job = await this.firebaseQueue.add('deliver', jobData, {
      attempts: FIREBASE_DELIVERY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: FIREBASE_DELIVERY_BACKOFF_MS,
      },
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs for analysis
    });

    return job.id.toString();
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
      return true;
    } catch (err: unknown) {
      this.logger.error(`Failed to send notification`, err);
      if (this.isRetryableError(err as admin.FirebaseError)) {
        await this.queueFirebaseDelivery(
          token,
          payload,
          payload.data.jobId,
          options,
        );
      }

      return false;
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

      await Promise.all(
        response.responses.map(async (resp, idx) => {
          if (!resp.success) {
            if (!resp.success && this.isRetryableError(resp.error)) {
              await this.queueFirebaseDelivery(
                tokens[idx],
                payload,
                payload.data?.jobId,
                options,
              );
            }
            this.logger.warn(
              `Failed to send to token ${tokens[idx]}: ${resp.error?.message}`,
            );
          }
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to send multicast notification: ${err}`);
    }
  }

  async processDeliveryJob(
    jobData: FirebaseDeliveryJob,
  ): Promise<FirebaseDeliveryResult> {
    const { tokens, payload, options, attempt = 1 } = jobData;
    const result: FirebaseDeliveryResult = {
      successfulTokens: [],
      failedTokens: [],
      attempt,
    };

    // Chunk tokens to respect Firebase's 500 limit
    const chunks = this.chunkArray(tokens, this.maxBatchSize);

    for (const chunk of chunks) {
      try {
        const chunkResult = await this.deliverBatch(chunk, payload, options);
        result.successfulTokens.push(...chunkResult.successfulTokens);
        result.failedTokens.push(...chunkResult.failedTokens);
      } catch (error: unknown) {
        this.logger.error(`Chunk delivery failed: `, error);
        chunk.forEach((token) => {
          result.failedTokens.push({
            token,
            error: error as admin.FirebaseError,
          });
        });
      }
    }

    this.logger.log(
      `Firebase delivery attempt ${attempt}: ${result.successfulTokens.length} success, ${result.failedTokens.length} failed`,
    );

    return result;
  }

  cleanupInvalidTokens(
    failedTokens: Array<{ token: string; error: admin.FirebaseError }>,
  ): string[] {
    const invalidTokens: string[] = [];

    for (const { token, error } of failedTokens) {
      const errorCode = error?.code;

      // Token is no longer valid, should be removed from database
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(token);
      }
    }

    if (invalidTokens.length > 0) {
      this.logger.warn(`Found ${invalidTokens.length} invalid FCM tokens`);
    }

    return invalidTokens;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
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
