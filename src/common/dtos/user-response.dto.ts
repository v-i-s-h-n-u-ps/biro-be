import { Expose } from 'class-transformer';

import { Role } from 'src/common/constants/rbac.enum';

export class UserResponseDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'uid' })
  uid: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'email' })
  email?: string;

  @Expose({ name: 'phone' })
  phone?: string;

  @Expose({ name: 'roles' })
  roles: Role[];
}
