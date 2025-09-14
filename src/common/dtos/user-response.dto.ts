import { Role } from 'src/common/constants/rbac.enum';
import { Expose, Transform } from 'class-transformer';

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
  @Transform(({ value }) => value.map((role: Role) => role.toLowerCase()), {
    toPlainOnly: true,
  })
  roles: Role[];
}
