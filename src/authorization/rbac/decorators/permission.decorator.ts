import { SetMetadata } from '@nestjs/common';

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

  return (
    target: (new (...args: unknown[]) => unknown) | object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    const Permissions = SetMetadata(PERMISSIONS_KEY, permissions);
    const RequireAll = SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll);
    if (propertyKey !== undefined && descriptor !== undefined) {
      Permissions(target, propertyKey, descriptor);
      RequireAll(target, propertyKey, descriptor);
    } else if (typeof target === 'function') {
      Permissions(target);
      RequireAll(target);
    }
  };
}
