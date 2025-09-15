import { RealtimeType } from 'src/common/constants/common.enum';

export interface RealtimeJob {
  userIds: string[];
  title?: string;
  body?: string;
  icon?: string;
  clickAction?: string;
  data?: Record<string, unknown>;
  type?: RealtimeType;
  websocketRoomIds?: string[];
}
