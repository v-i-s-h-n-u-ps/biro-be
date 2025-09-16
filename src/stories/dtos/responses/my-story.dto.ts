import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsString, IsUrl } from 'class-validator';

export class ViewersDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsString()
  profileImage: string;

  @IsDate()
  viewedAt: Date;
}

export class MyStoryDto {
  @IsString()
  storyId: string;

  @IsString()
  @IsUrl()
  media: string;

  @IsDate()
  createdAt: Date;

  @IsNumber()
  @Type(() => Number)
  viewCount: number;

  viewers: ViewersDto[];
}
