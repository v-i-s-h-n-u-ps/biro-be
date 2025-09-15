import { Inject, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

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

  /**
   * Send a notification to a single device
   */
  async sendNotificationToDevice(
    deviceToken: string,
    payload: admin.messaging.MessagingPayload,
  ) {
    try {
      await this.firebaseAdmin.messaging().send({
        token: deviceToken,
        notification: payload.notification,
        data: payload.data,
      });
    } catch (err) {
      this.logger.error(`Failed to send notification: ${err}`);
    }
  }

  /**
   * Send a notification to multiple devices
   */
  async sendNotificationToDevices(
    deviceTokens: string[],
    payload: admin.messaging.MessagingPayload,
  ) {
    if (deviceTokens.length === 0) return;

    try {
      const response = await this.firebaseAdmin
        .messaging()
        .sendEachForMulticast({
          tokens: deviceTokens,
          notification: payload.notification,
          data: payload.data,
        });

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.logger.warn(
            `Failed to send to token ${deviceTokens[idx]}: ${resp.error?.message}`,
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
