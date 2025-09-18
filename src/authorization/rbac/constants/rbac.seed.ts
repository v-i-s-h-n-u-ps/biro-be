import { Permission, Role } from 'src/common/constants/rbac.enum';

export const RolesList = [
  { id: Role.USER, name: 'User', description: 'Default user role' },
  { id: Role.ADMIN, name: 'Admin', description: 'Administrator' },
];

export const PermissionsList = [
  // Profile
  {
    id: Permission.UPDATE_OWN_PROFILE,
    name: 'Update Own Profile',
    description: 'User can update their own profile',
  },
  {
    id: Permission.UPDATE_ANY_PROFILE,
    name: 'Update Any Profile',
    description: 'Admin can update any profile',
  },

  // Rides
  {
    id: Permission.CREATE_RIDE,
    name: 'Create Ride',
    description: 'User can create a new ride',
  },
  {
    id: Permission.UPDATE_OWN_RIDE,
    name: 'Update Own Ride',
    description: 'User can update their own ride',
  },
  {
    id: Permission.UPDATE_ANY_RIDE,
    name: 'Update Any Ride',
    description: 'Admin can update any ride',
  },
  {
    id: Permission.VIEW_RIDE,
    name: 'View Ride',
    description: 'User can view rides',
  },
  {
    id: Permission.JOIN_RIDE,
    name: 'Join Ride',
    description: 'User can request to join a ride',
  },

  // Following
  {
    id: Permission.FOLLOW_USER,
    name: 'Follow User',
    description: 'User can follow another user',
  },
  {
    id: Permission.UNFOLLOW_USER,
    name: 'Unfollow User',
    description: 'User can unfollow another user',
  },

  // Stories
  {
    id: Permission.CREATE_STORY,
    name: 'Create Story',
    description: 'User can create stories',
  },
  {
    id: Permission.UPDATE_OWN_STORY,
    name: 'Update Own Story',
    description: 'User can update their own stories',
  },
  {
    id: Permission.UPDATE_ANY_STORY,
    name: 'Update Any Story',
    description: 'Admin can update any stories',
  },
  {
    id: Permission.VIEW_STORY,
    name: 'View Story',
    description: 'User can view stories',
  },
];

export const RolePermissionsMap: Record<Role, Permission[]> = {
  [Role.ADMIN]: PermissionsList.map((p) => p.id), // Admin gets all permissions
  [Role.USER]: PermissionsList.filter(
    (p) =>
      ![
        Permission.UPDATE_ANY_PROFILE,
        Permission.UPDATE_ANY_RIDE,
        Permission.UPDATE_ANY_STORY,
      ].includes(p.id),
  ).map((p) => p.id), // User gets all except admin-level permissions
};
