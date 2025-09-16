import { IsString, IsUUID } from 'class-validator';

export class UserBasicDetailsDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  image?: string;
}
