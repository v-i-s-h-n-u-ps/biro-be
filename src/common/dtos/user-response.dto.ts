import { Expose, Type } from 'class-transformer';

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
  @Type(() => RolesResponseDto)
  roles: RolesResponseDto[];
}

export class RolesResponseDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'name' })
  name?: string;

  @Expose({ name: 'permissions' })
  @Type(() => PermissionsResponseDto)
  permissions?: PermissionsResponseDto[];
}

export class PermissionsResponseDto {
  @Expose({ name: 'id' })
  id: string;
}
