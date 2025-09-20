import { applyDecorators, SetMetadata } from '@nestjs/common';

import { ResourceType } from 'src/common/constants/common.enum';
import { ResourceRole } from 'src/common/constants/rbac.enum';

export interface ResourceRoleRequirement {
  resource: ResourceType;
  roles: ResourceRole[];
  requireAll?: boolean;
}

export const RESOURCE_ROLES_KEY = 'resource_roles';

export const ResourceRoles = (...requirements: ResourceRoleRequirement[]) =>
  applyDecorators(SetMetadata(RESOURCE_ROLES_KEY, requirements));
