import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';

export function Permissions(
  ...args: (string | string[] | boolean)[]
): ClassDecorator & MethodDecorator {
  let requireAll = false;
  const permissions: string[] = [];

  for (const arg of args) {
    if (typeof arg === 'boolean') {
      requireAll = arg;
    } else if (Array.isArray(arg)) {
      permissions.push(...arg);
    } else if (typeof arg === 'string') {
      permissions.push(arg);
    }
  }

  return (
    target: Function | Object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey !== undefined && descriptor !== undefined) {
      // Method decorator
      SetMetadata(PERMISSIONS_KEY, permissions)(
        target,
        propertyKey,
        descriptor,
      );
      SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll)(
        target,
        propertyKey,
        descriptor,
      );
    } else if (typeof target === 'function') {
      // Class decorator
      SetMetadata(PERMISSIONS_KEY, permissions)(target);
      SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, requireAll)(target);
    }
  };
}
