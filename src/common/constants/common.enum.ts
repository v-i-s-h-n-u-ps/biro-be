export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum QueueName {
  NOTIFICATIONS = 'notifications',
  CHAT = 'chat',
}

export enum WebSocketNamespace {
  NOTIFICATIONS = 'notifications',
  CHAT = 'chat',
  RIDE = 'ride',
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

export enum ParticipantStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export enum RideStatus {
  UPCOMING = 'upcoming',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DeliveryStrategy {
  WS_ONLY = 'ws_only',
  PUSH_ONLY = 'push_only',
  WS_THEN_PUSH = 'ws_then_push',
}

export enum ResourceType {
  RIDE = 'ride',
  CHAT = 'chat',
  ORGANIZATION = 'organization',
}
