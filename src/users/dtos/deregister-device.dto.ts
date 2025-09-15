import { IsString, Length } from 'class-validator';

export class DeregisterDeviceDto {
  @IsString()
  @Length(10, 512)
  deviceToken: string;
}
