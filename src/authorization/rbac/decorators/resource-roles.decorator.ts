import { SetMetadata } from '@nestjs/common';

import { ResourceRole } from 'src/common/constants/rbac.enum';

export const RESOURCE_ROLES_KEY = 'resourceRoles';
export const REQUIRE_ALL_RESOURCE_ROLES_KEY = 'requireAllResourceRoles';

export function ResourceRoles(
  ...args: (ResourceRole | ResourceRole[] | boolean)[]
): ClassDecorator & MethodDecorator {
  let requireAll = false;
  const roles: ResourceRole[] = [];

  args.forEach((arg) => {
    if (typeof arg === 'boolean') {
      requireAll = arg;
    } else if (Array.isArray(arg)) {
      roles.push(...arg);
    } else if (typeof arg === 'string') {
      roles.push(arg);
    }
  });

  return (
    target: (new (...args: unknown[]) => unknown) | object,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    const ResourceRoles = SetMetadata(RESOURCE_ROLES_KEY, roles);
    const RequireAll = SetMetadata(REQUIRE_ALL_RESOURCE_ROLES_KEY, requireAll);
    if (propertyKey !== undefined && descriptor !== undefined) {
      ResourceRoles(target, propertyKey, descriptor);
      RequireAll(target, propertyKey, descriptor);
    } else if (typeof target === 'function') {
      ResourceRoles(target);
      RequireAll(target);
    }
  };
}
