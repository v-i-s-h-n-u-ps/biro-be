import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const REQUIRE_ALL_ROLES_KEY = 'requireAllRoles';

export function Roles(
  ...args: (string | string[] | boolean)[]
): ClassDecorator & MethodDecorator {
  let requireAll = false;
  const roles: string[] = [];

  for (const arg of args) {
    if (typeof arg === 'boolean') {
      requireAll = arg;
    } else if (Array.isArray(arg)) {
      roles.push(...arg);
    } else if (typeof arg === 'string') {
      roles.push(arg);
    }
  }

  return (
    target: (new (...args: unknown[]) => unknown) | object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey !== undefined && descriptor !== undefined) {
      // Method decorator
      SetMetadata(ROLES_KEY, roles)(target, propertyKey, descriptor);
      SetMetadata(REQUIRE_ALL_ROLES_KEY, requireAll)(
        target,
        propertyKey,
        descriptor,
      );
    } else if (typeof target === 'function') {
      // Class decorator
      SetMetadata(ROLES_KEY, roles)(target);
      SetMetadata(REQUIRE_ALL_ROLES_KEY, requireAll)(target);
    }
  };
}
