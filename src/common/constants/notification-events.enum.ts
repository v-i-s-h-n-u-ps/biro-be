export enum NotificationEvents {
  NotificationNew = 'notification:new',
  NotificationDeleted = 'notification:deleted',

  // connections
  NotificationFollowRequest = 'notification:follow:request',
  NotificationFollowAccepted = 'notification:follow:accepted',
  NotificationFollowNew = 'notification:follow:new',

  // rides
  NotificationRideInvite = 'notification:ride:invite',
  NotificationRideUpdate = 'notification:ride:update',
  NotificationRideCancelled = 'notification:ride:cancelled',
  NotificationRideCompleted = 'notification:ride:completed',
  NotificationRideReminder = 'notification:ride:reminder',

  // ride location
  NotificationRideCurrentLocation = 'notification:ride:current_location',
  NotificationRideLocationUpdate = 'notification:ride:location_update',

  // ride participants
  NotificationParticipantRequest = 'notification:participant:request',
  NotificationParticipantAccepted = 'notification:participant:accepted',
  NotificationRideParticipantJoined = 'notification:ride:participant_joined',
  NotificationParticipantDeclined = 'notification:participant:declined',

  // chat
  NotificationChatJoined = 'notification:chat:join',
  NotificationChatNewMessage = 'notification:chat:new_message',
  NotificationChatTyping = 'notification:chat:typing',
  NotificationChatSeen = 'notification:chat:seen',
  NotificationChatMentions = 'notification:chat:mentions',

  // stories
  NotificationStoryCreated = 'notification:story:created',
  NotificationStoryView = 'notification:story:view',

  // system
  NotificationAppAnnouncement = 'notification:app:announcement',
  NotificationAppMaintenance = 'notification:app:maintenance',

  // user presence
  NotificationUserOnline = 'notification:user:online',
  NotificationUserOffline = 'notification:user:offline',
}

export enum ClientEvents {
  PresenceJoin = 'PRESENCE_JOIN',
  JoinRide = 'JOIN_RIDE',
  UpdateLocation = 'UPDATE_LOCATION',
  LeaveRide = 'LEAVE_RIDE',
  JoinChat = 'JOIN_CHAT',
  LeaveChat = 'LEAVE_CHAT',
  MessageDelivered = 'MESSAGE_DELIVERED',
  Acknowledged = 'ACKNOWLEDGED',
}
