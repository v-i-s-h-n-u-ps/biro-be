export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum QueueName {
  NOTIFICATIONS = 'notifications',
  CHAT = 'chat',
}

export enum RealtimeType {
  CHAT_MESSAGE = 'chat_message',
  RIDE_INVITE = 'ride_invite',
  RIDE_ACCEPTED = 'ride_accepted',
  RIDE_REMINDER = 'ride_reminder',
  FOLLOW_REQUEST = 'follow_request',
  FOLLOWED = 'followed',
  COMMENT = 'comment',
  LIKE = 'like',
  MENTION = 'mention',
  GENERAL = 'general',
}

export enum NotificationChannel {
  WEBSOCKET = 'websocket',
  PUSH = 'push',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export enum FollowStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
}

export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
