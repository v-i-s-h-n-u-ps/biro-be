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
  data?: Record<string, string>;
  wsData?: Record<string, unknown>;
  pushData?: {
    [key: string]: string;
  };
}

export interface RealtimeJob {
  jobId: string;
  userIds: string[];
  websocketRoomIds: string[];
  event: NotificationEvents;
  namespace: WebSocketNamespace;
  payload: RealtimePayload;
  options: JobDefaults;
  createdAt?: number;
}

export interface JobDefaults {
  strategy: DeliveryStrategy;
  emitToRoom?: boolean;
  emitToUser?: boolean;
}
