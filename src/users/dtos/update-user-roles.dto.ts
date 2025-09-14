import { IsArray, IsEnum } from 'class-validator';

import { Role } from 'src/common/constants/rbac.enum';

export class UpdateUserRolesDto {
  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];
}
