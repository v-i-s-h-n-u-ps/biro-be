import { IsIn, IsString, Length } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @Length(10, 512)
  deviceToken: string;

  @IsIn(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @IsString()
  name?: string;

  @IsString()
  appVersion?: string;
}
