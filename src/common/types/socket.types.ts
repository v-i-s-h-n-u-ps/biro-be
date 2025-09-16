import { DefaultEventsMap, Socket } from 'socket.io';

export interface PresenceSocketData {
  userId?: string;
  deviceId?: string;
}

export type PresenceSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  PresenceSocketData
>;
