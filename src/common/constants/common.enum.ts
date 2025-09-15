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
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  RIDE_INVITE = 'RIDE_INVITE',
  RIDE_ACCEPTED = 'RIDE_ACCEPTED',
  RIDE_REMINDER = 'RIDE_REMINDER',
  FOLLOW_REQUEST = 'FOLLOW_REQUEST',
  FOLLOWED = 'FOLLOWED',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  MENTION = 'MENTION',
  GENERAL = 'GENERAL',
}

export enum NotificationChannel {
  WEBSOCKET = 'WEBSOCKET',
  PUSH = 'PUSH',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export enum FriendRequestStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
