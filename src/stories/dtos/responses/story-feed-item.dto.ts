import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsString, IsUrl } from 'class-validator';

export class StoryItemDto {
  @IsString()
  id: string;

  @IsString()
  @IsUrl()
  media: string;

  @IsDate()
  createdAt: Date;

  @IsBoolean()
  @Type(() => Boolean)
  seen: boolean;
}

export class StoryFeedItemDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsString()
  profileImage: string;

  stories: StoryItemDto[];
}
