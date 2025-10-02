import { NotificationEvents } from 'src/common/constants/notification-events.enum';

export const eventPriorityMap: Record<NotificationEvents, 'high' | 'normal'> = {
  // generic notifications
  [NotificationEvents.NotificationNew]: 'high',
  [NotificationEvents.NotificationDeleted]: 'normal',

  // connections
  [NotificationEvents.NotificationFollowRequest]: 'high',
  [NotificationEvents.NotificationFollowAccepted]: 'high',
  [NotificationEvents.NotificationFollowNew]: 'normal',

  // rides
  [NotificationEvents.NotificationRideInvite]: 'high',
  [NotificationEvents.NotificationRideUpdate]: 'high',
  [NotificationEvents.NotificationRideCancelled]: 'high',
  [NotificationEvents.NotificationRideCompleted]: 'normal',
  [NotificationEvents.NotificationRideReminder]: 'high',

  // ride location
  [NotificationEvents.NotificationRideCurrentLocation]: 'normal',
  [NotificationEvents.NotificationRideLocationUpdate]: 'normal',

  // ride participants
  [NotificationEvents.NotificationParticipantRequest]: 'high',
  [NotificationEvents.NotificationParticipantAccepted]: 'high',
  [NotificationEvents.NotificationRideParticipantJoined]: 'normal',
  [NotificationEvents.NotificationParticipantDeclined]: 'high',

  // chat
  [NotificationEvents.NotificationChatJoined]: 'normal',
  [NotificationEvents.NotificationChatNewMessage]: 'high',
  [NotificationEvents.NotificationChatTyping]: 'normal',
  [NotificationEvents.NotificationChatSeen]: 'normal',
  [NotificationEvents.NotificationChatMentions]: 'high',

  // stories
  [NotificationEvents.NotificationStoryCreated]: 'normal',
  [NotificationEvents.NotificationStoryView]: 'normal',

  // system
  [NotificationEvents.NotificationAppAnnouncement]: 'high',
  [NotificationEvents.NotificationAppMaintenance]: 'high',

  // user presence
  [NotificationEvents.NotificationUserOnline]: 'normal',
  [NotificationEvents.NotificationUserOffline]: 'normal',
};
