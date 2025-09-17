import { NotificationEvents } from 'src/common/constants/notification-events.enum';

export const eventPriorityMap: Record<NotificationEvents, 'high' | 'normal'> = {
  // generic notifications
  [NotificationEvents.NEW_NOTIFICATION]: 'high',
  [NotificationEvents.NOTIFICATION_DELETED]: 'normal',

  // connections
  [NotificationEvents.NOTIFICATION_FOLLOW_REQUEST]: 'high',
  [NotificationEvents.NOTIFICATION_FOLLOW_ACCEPTED]: 'high',
  [NotificationEvents.NOTIFICATION_FOLLOW_NEW]: 'normal',

  // rides
  [NotificationEvents.NOTIFICATION_RIDE_INVITE]: 'high',
  [NotificationEvents.NOTIFICATION_RIDE_UPDATE]: 'high',
  [NotificationEvents.NOTIFICATION_RIDE_CANCELLED]: 'high',
  [NotificationEvents.NOTIFICATION_RIDE_COMPLETED]: 'normal',
  [NotificationEvents.NOTIFICATION_RIDE_REMINDER]: 'high',

  // ride location
  [NotificationEvents.NOTIFICATION_RIDE_CURRENT_LOCATION]: 'normal',
  [NotificationEvents.NOTIFICATION_RIDE_LOCATION_UPDATE]: 'normal',

  // ride participants
  [NotificationEvents.NOTIFICATION_PARTICIPANT_REQUEST]: 'high',
  [NotificationEvents.NOTIFICATION_PARTICIPANT_ACCEPTED]: 'high',
  [NotificationEvents.NOTIFICATION_RIDE_PARTICIPANT_JOINED]: 'normal',
  [NotificationEvents.NOTIFICATION_PARTICIPANT_DECLINED]: 'high',

  // chat
  [NotificationEvents.NOTIFICATION_CHAT_JOINED]: 'normal',
  [NotificationEvents.NOTIFICATION_CHAT_NEW_MESSAGE]: 'high',
  [NotificationEvents.NOTIFICATION_CHAT_TYPING]: 'normal',
  [NotificationEvents.NOTIFICATION_CHAT_SEEN]: 'normal',
  [NotificationEvents.NOTIFICATION_CHAT_MENTIONS]: 'high',

  // stories
  [NotificationEvents.NOTIFICATION_STORY_CREATED]: 'normal',
  [NotificationEvents.NOTIFICATION_STORY_VIEW]: 'normal',

  // system
  [NotificationEvents.NOTIFICATION_APP_ANNOUNCEMENT]: 'high',
  [NotificationEvents.NOTIFICATION_APP_MAINTENANCE]: 'high',

  // user presence
  [NotificationEvents.NOTIFICATION_USER_ONLINE]: 'normal',
  [NotificationEvents.NOTIFICATION_USER_OFFLINE]: 'normal',
};
