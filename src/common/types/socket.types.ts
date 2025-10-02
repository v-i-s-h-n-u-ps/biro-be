import { DefaultEventsMap, Socket } from 'socket.io';

import { User } from 'src/users/entities/users.entity';

export interface PresenceSocketData {
  userId?: string;
  deviceId?: string;
  user?: User;
  lastConnectionTime?: number;
}

export interface PresenceSocketAuth {
  token?: string;
}

export type PresenceSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  PresenceSocketData
> & {
  handshake: Socket['handshake'] & { auth: PresenceSocketAuth };
};
