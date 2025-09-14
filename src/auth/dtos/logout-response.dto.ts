import { Expose } from 'class-transformer';

export class LogoutResponseDto {
  @Expose({ name: 'message' })
  message: string;
}
