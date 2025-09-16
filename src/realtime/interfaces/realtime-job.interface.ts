import {
  DeliveryStrategy,
  WebSocketNamespace,
} from 'src/common/constants/common.enum';
import { NotificationEvents } from 'src/common/constants/notification-events.enum';

export interface RealtimePayload {
  title?: string;
  body?: string;
  icon?: string;
  clickAction?: string;
  data?: Record<string, unknown>;
}

export interface RealtimeJob {
  userIds: string[];
  websocketRoomIds: string[];
  event: NotificationEvents;
  namespace: WebSocketNamespace;
  payload: RealtimePayload;
  options: JobDefaults;
}

export interface JobDefaults {
  strategy: DeliveryStrategy;
  emitToRoom?: boolean;
  emitToUser?: boolean;
}
