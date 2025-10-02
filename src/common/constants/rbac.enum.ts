export enum Role {
  User = 'user',
  Admin = 'admin',
}

export enum Permission {
  // Profile management
  UpdateOwnProfile = 'update:own:profile',
  UpdateAnyProfile = 'update:any:profile',

  // Rides
  CreateRide = 'create:ride',
  UpdateOwnRide = 'update:own:ride',
  UpdateAnyRide = 'update:any:ride',
  ViewRide = 'view:ride',
  JoinRide = 'join:ride',

  // Following
  FollowUser = 'follow:user',
  UnfollowUser = 'unfollow:user',

  // Stories
  CreateStory = 'create:story',
  UpdateOwnStory = 'update:own:story',
  UpdateAnyStory = 'update:any:story',
  ViewStory = 'view:story',
}

export enum ResourceRole {
  RideOwner = 'ride_owner',
  RideModerator = 'ride_moderator',
  RideMember = 'ride_member',
  StoryOwner = 'story_owner',
  ChatOwner = 'chat_owner',
  ChatMember = 'chat_member',
}

export enum RESOURCE {
  PRO = 'profile',
  Ride = 'ride',
  Story = 'story',
  Chat = 'chat',
}
