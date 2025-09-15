import { NotificationMessagePayload } from 'firebase-admin/messaging';

export interface NotificationPayload {
  title: NotificationMessagePayload['title'];
  body: NotificationMessagePayload['body'];
  icon?: string;
  clickAction?: string;
  data?: Record<string, string>;
}
