import { Expose } from 'class-transformer';

import { Roles } from 'src/rbac/entities/role.entity';

export class UserResponseDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'firebase_id' })
  firebaseUid: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'email' })
  email?: string;

  @Expose({ name: 'phone' })
  phone?: string;

  @Expose({ name: 'roles' })
  roles: Roles[];
}
