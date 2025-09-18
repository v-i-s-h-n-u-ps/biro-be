import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

import { User } from 'src/users/entities/users.entity';

export class UserBasicDetailsDto {
  @IsUUID()
  id: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  image?: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.profile?.name)
  name?: string;

  @Expose()
  @Transform(({ obj }: { obj: User }) => obj.profile?.avatarUrl)
  avatarUrl?: string;
}
