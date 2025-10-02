import { Permission, Role } from 'src/common/constants/rbac.enum';

export const RolesList = [
  { id: Role.User, name: 'User', description: 'Default user role' },
  { id: Role.Admin, name: 'Admin', description: 'Administrator' },
];

export const PermissionsList = [
  // Profile
  {
    id: Permission.UpdateOwnProfile,
    name: 'Update Own Profile',
    description: 'User can update their own profile',
  },
  {
    id: Permission.UpdateAnyProfile,
    name: 'Update Any Profile',
    description: 'Admin can update any profile',
  },

  // Rides
  {
    id: Permission.CreateRide,
    name: 'Create Ride',
    description: 'User can create a new ride',
  },
  {
    id: Permission.UpdateOwnRide,
    name: 'Update Own Ride',
    description: 'User can update their own ride',
  },
  {
    id: Permission.UpdateAnyRide,
    name: 'Update Any Ride',
    description: 'Admin can update any ride',
  },
  {
    id: Permission.ViewRide,
    name: 'View Ride',
    description: 'User can view rides',
  },
  {
    id: Permission.JoinRide,
    name: 'Join Ride',
    description: 'User can request to join a ride',
  },

  // Following
  {
    id: Permission.FollowUser,
    name: 'Follow User',
    description: 'User can follow another user',
  },
  {
    id: Permission.UnfollowUser,
    name: 'Unfollow User',
    description: 'User can unfollow another user',
  },

  // Stories
  {
    id: Permission.CreateStory,
    name: 'Create Story',
    description: 'User can create stories',
  },
  {
    id: Permission.UpdateOwnStory,
    name: 'Update Own Story',
    description: 'User can update their own stories',
  },
  {
    id: Permission.UpdateAnyStory,
    name: 'Update Any Story',
    description: 'Admin can update any stories',
  },
  {
    id: Permission.ViewStory,
    name: 'View Story',
    description: 'User can view stories',
  },
];

export const RolePermissionsMap: Record<Role, Permission[]> = {
  [Role.Admin]: PermissionsList.map((p) => p.id), // Admin gets all permissions
  [Role.User]: PermissionsList.filter(
    (p) =>
      ![
        Permission.UpdateAnyProfile,
        Permission.UpdateAnyRide,
        Permission.UpdateAnyStory,
      ].includes(p.id),
  ).map((p) => p.id), // User gets all except admin-level permissions
};
