import { DefaultEventsMap, Socket } from 'socket.io';

import { User } from 'src/users/entities/users.entity';

export interface PresenceSocketData {
  userId?: string;
  deviceId?: string;
  user?: User;
  lastConnectionTime?: number;
}

// Define the handshake auth structure
export interface PresenceSocketAuth {
  token?: string;
}

// Extend Socket type
export type PresenceSocket = Socket<
  DefaultEventsMap, // Events from server
  DefaultEventsMap, // Events to client
  DefaultEventsMap, // Reserved for ServerSideEvents
  PresenceSocketData // socket.data
> & {
  handshake: Socket['handshake'] & { auth: PresenceSocketAuth };
};
