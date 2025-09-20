import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  deviceToken: string;

  @IsString()
  platform: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  @Length(1, 50)
  osName: string | null = null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  osVersion: string | null = null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  appVersion: string | null = null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name: string | null = null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  model: string | null = null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  manufacturer: string | null = null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isEmulator: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive: boolean = true;
}
