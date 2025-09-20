import { applyDecorators, SetMetadata } from '@nestjs/common';

import { Role } from 'src/common/constants/rbac.enum';

export const ROLES_KEY = 'roles';
export const REQUIRE_ALL_ROLES_KEY = 'requireAllRoles';

export function Roles(
  ...args: (Role | Role[] | boolean)[]
): ClassDecorator & MethodDecorator {
  let requireAll = false;
  const roles: Role[] = [];

  args.forEach((arg) => {
    if (typeof arg === 'boolean') {
      requireAll = arg;
    } else if (Array.isArray(arg)) {
      roles.push(...arg);
    } else if (typeof arg === 'string') {
      roles.push(arg);
    }
  });

  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    SetMetadata(REQUIRE_ALL_ROLES_KEY, requireAll),
  );
}
