import { SetMetadata } from '@nestjs/common';

export const RESOURCE_ROLES_KEY = 'resourceRoles';
export const REQUIRE_ALL_RESOURCE_ROLES_KEY = 'requireAllResourceRoles';

export function ResourceRoles(
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
      SetMetadata(RESOURCE_ROLES_KEY, roles)(target, propertyKey, descriptor);
      SetMetadata(REQUIRE_ALL_RESOURCE_ROLES_KEY, requireAll)(
        target,
        propertyKey,
        descriptor,
      );
    } else if (typeof target === 'function') {
      // Class decorator
      SetMetadata(RESOURCE_ROLES_KEY, roles)(target);
      SetMetadata(REQUIRE_ALL_RESOURCE_ROLES_KEY, requireAll)(target);
    }
  };
}
