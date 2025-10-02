export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export enum QueueName {
  Notifications = 'notifications',
  Chat = 'chat',
  PendingSweep = 'pending_sweep',
  FirebaseDelivery = 'firebase_delivery',
}

export enum WebSocketNamespace {
  Notifications = 'notifications',
  Chat = 'chat',
  Ride = 'ride',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Banned = 'banned',
}

export enum FollowStatus {
  Pending = 'pending',
  Accepted = 'accepted',
}

export enum ParticipantStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
}

export enum RideStatus {
  Upcoming = 'upcoming',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum DeliveryStrategy {
  WsOnly = 'ws_only',
  PushOnly = 'push_only',
  WsThenPush = 'ws_then_push',
}

export enum ResourceType {
  Ride = 'ride',
  Chat = 'chat',
  Organization = 'organization',
}
