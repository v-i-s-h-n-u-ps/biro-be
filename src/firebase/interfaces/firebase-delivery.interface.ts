import * as admin from 'firebase-admin';

export type NotificationOptions =
  | {
      type: 'silent' | 'normal';
      activityId?: undefined;
    }
  | { type: 'live'; activityId: string };

export interface FirebaseDeliveryJob {
  jobId: string;
  tokens: string[];
  payload: admin.messaging.MessagingPayload;
  options: NotificationOptions;
  attempt?: number;
  createdAt: number;
}

export interface FirebaseDeliveryResult {
  successfulTokens: string[];
  failedTokens: Array<{ token: string; error: admin.FirebaseError }>;
  attempt: number;
}
