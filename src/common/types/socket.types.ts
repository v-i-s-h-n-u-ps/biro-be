import { DefaultEventsMap, Socket } from 'socket.io';

export interface PresenceSocketData {
  userId?: string;
  deviceId?: string;
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
