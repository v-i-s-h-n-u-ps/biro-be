import { Expose } from 'class-transformer';

import { Gender } from 'src/common/constants/common.enum';

export class ProfileResponseDto {
  @Expose()
  name: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  gender?: Gender;

  @Expose()
  dateOfBirth?: Date;

  @Expose()
  bio?: string;

  @Expose()
  followersCount: number;

  @Expose()
  followingCount: number;

  @Expose()
  ridesCount: number;

  @Expose()
  isPrivate: boolean;
}

export class UserProfileResponseDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'email' })
  email?: string;

  @Expose({ name: 'phone' })
  phone?: string;

  @Expose({ name: 'profile' })
  profile: ProfileResponseDto;
}
