import { IsArray, IsUrl } from 'class-validator';

export class CreateStoryDto {
  @IsArray()
  @IsUrl({}, { each: true })
  media: string[];
}
