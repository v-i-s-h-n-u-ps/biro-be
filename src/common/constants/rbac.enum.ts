export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export enum Permission {
  // Profile management
  UPDATE_OWN_PROFILE = 'update:own:profile',
  UPDATE_ANY_PROFILE = 'update:any:profile',

  // Rides
  CREATE_RIDE = 'create:ride',
  UPDATE_OWN_RIDE = 'update:own:ride',
  UPDATE_ANY_RIDE = 'update:any:ride',
  VIEW_RIDE = 'view:ride',
  JOIN_RIDE = 'join:ride',

  // Following
  FOLLOW_USER = 'follow:user',
  UNFOLLOW_USER = 'unfollow:user',

  // Stories
  CREATE_STORY = 'create:story',
  UPDATE_OWN_STORY = 'update:own:story',
  UPDATE_ANY_STORY = 'update:any:story',
  VIEW_STORY = 'view:story',
}

export enum ResourceRole {
  RIDE_OWNER = 'ride_owner',
  RIDE_MODERATOR = 'ride_moderator',
  RIDE_MEMBER = 'ride_member',
  STORY_OWNER = 'story_owner',
  CHAT_OWNER = 'chat_owner',
  CHAT_MEMBER = 'chat_member',
}
