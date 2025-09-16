import { Type } from 'class-transformer';
import { IsEnum, IsObject, IsUUID } from 'class-validator';

import { FollowStatus } from 'src/common/constants/common.enum';
import { UserBasicDetailsDto } from 'src/common/dtos/user-basic-details.dto';

export class FollowDto {
  @IsUUID()
  id: string;

  @IsObject()
  @Type(() => UserBasicDetailsDto)
  follower: UserBasicDetailsDto;

  @IsObject()
  @Type(() => UserBasicDetailsDto)
  following: UserBasicDetailsDto;

  @IsEnum(FollowStatus)
  status: FollowStatus;
}
