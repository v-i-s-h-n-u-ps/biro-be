import { applyDecorators, SetMetadata } from '@nestjs/common';

import { Permission } from 'src/common/constants/rbac.enum';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';

export function Permissions(
  ...args: (Permission | Permission[] | boolean)[]
): ClassDecorator & MethodDecorator {
  let requireAll = false;
  const permissions: Permission[] = [];

  args.forEach((arg) => {
    if (typeof arg === 'boolean') {
      requireAll = arg;
    } else if (Array.isArray(arg)) {
      permissions.push(...arg);
    } else if (typeof arg === 'string') {
      permissions.push(arg);
    }
  });

  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll),
  );
}
