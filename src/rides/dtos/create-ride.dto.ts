import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { RideStatus } from 'src/common/constants/common.enum';

export class LatLng {
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  lng: number;
}

export class CreateRideDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsString()
  @IsNotEmpty()
  startPoint: LatLng; // WKT or GeoJSON string, adjust as needed

  @IsString()
  @IsNotEmpty()
  endPoint: LatLng; // WKT or GeoJSON string, adjust as needed

  @IsString()
  @IsOptional()
  route?: LatLng[]; // WKT or GeoJSON string, adjust as needed

  @IsEnum(RideStatus)
  @IsOptional()
  status?: RideStatus = RideStatus.Upcoming;
}
