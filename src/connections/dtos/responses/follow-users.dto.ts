import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class FollowUserDto {
  @IsString()
  id: string;

  @IsString()
  name?: string | null;

  @IsString()
  avatarUrl: string | null;

  @IsNumber()
  @Type(() => Number)
  followersCount: number;

  @IsNumber()
  @Type(() => Number)
  followingCount: number;
}
