export enum NotificationEvents {
  NEW_NOTIFICATION = 'notification:new',
  NOTIFICATION_DELETED = 'notification:deleted',

  // connections
  NOTIFICATION_FOLLOW_REQUEST = 'notification:follow:request',
  NOTIFICATION_FOLLOW_ACCEPTED = 'notification:follow:accepted',
  NOTIFICATION_FOLLOW_NEW = 'notification:follow:new',

  // rides
  NOTIFICATION_RIDE_INVITE = 'notification:ride:invite',
  NOTIFICATION_RIDE_UPDATE = 'notification:ride:update',
  NOTIFICATION_RIDE_CANCELLED = 'notification:ride:cancelled',
  NOTIFICATION_RIDE_COMPLETED = 'notification:ride:completed',
  NOTIFICATION_RIDE_REMINDER = 'notification:ride:reminder',

  // ride location
  NOTIFICATION_RIDE_CURRENT_LOCATION = 'notification:ride:current_location',
  NOTIFICATION_RIDE_LOCATION_UPDATE = 'notification:ride:location_update',

  // ride participants
  NOTIFICATION_PARTICIPANT_REQUEST = 'notification:participant:request',
  NOTIFICATION_PARTICIPANT_ACCEPTED = 'notification:participant:accepted',
  NOTIFICATION_RIDE_PARTICIPANT_JOINED = 'notification:ride:participant_joined',
  NOTIFICATION_PARTICIPANT_DECLINED = 'notification:participant:declined',

  // chat
  NOTIFICATION_CHAT_JOINED = 'notification:chat:join',
  NOTIFICATION_CHAT_NEW_MESSAGE = 'notification:chat:new_message',
  NOTIFICATION_CHAT_TYPING = 'notification:chat:typing',
  NOTIFICATION_CHAT_SEEN = 'notification:chat:seen',
  NOTIFICATION_CHAT_MENTIONS = 'notification:chat:mentions',

  // stories
  NOTIFICATION_STORY_CREATED = 'notification:story:created',
  NOTIFICATION_STORY_VIEW = 'notification:story:view',

  // system
  NOTIFICATION_APP_ANNOUNCEMENT = 'notification:app:announcement',
  NOTIFICATION_APP_MAINTENANCE = 'notification:app:maintenance',

  // user presence
  NOTIFICATION_USER_ONLINE = 'notification:user:online',
  NOTIFICATION_USER_OFFLINE = 'notification:user:offline',
}

export enum ClientEvents {
  PRESENCE_JOIN = 'PRESENCE_JOIN',
  JOIN_RIDE = 'JOIN_RIDE',
  UPDATE_LOCATION = 'UPDATE_LOCATION',
  LEAVE_RIDE = 'LEAVE_RIDE',
  JOIN_CHAT = 'JOIN_CHAT',
  MESSAGE_DELIVERED = 'MESSAGE_DELIVERED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}
