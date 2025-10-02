import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { type Request } from 'express';
import { Observable, tap } from 'rxjs';
import { Repository } from 'typeorm';

import { SKIP_INTERCEPTOR_KEY } from 'src/common/decorators/skip-interceptor.decorator';
import { UserDevice } from 'src/users/entities/user-devices.entity';
import { User } from 'src/users/entities/users.entity';

import { RegisterDeviceDto } from '../dtos/register-device.dto';

@Injectable()
export class DeviceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DeviceInterceptor.name);

  constructor(
    @InjectRepository(UserDevice)
    private readonly userDeviceRepo: Repository<UserDevice>,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_INTERCEPTOR_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const user: User | undefined = request.user;
    if (!user) return next.handle();

    const header = request.headers['x-device-info'];
    if (!header || typeof header !== 'string') return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          try {
            const dto = plainToInstance(RegisterDeviceDto, JSON.parse(header), {
              exposeDefaultValues: true,
              enableImplicitConversion: true,
            });
            const errors = validateSync(dto);
            if (errors.length) {
              this.logger.warn('Invalid device info:', errors);
              return;
            }
            this.userDeviceRepo
              .upsert({ ...dto, user }, ['deviceId'])
              .catch((err) =>
                this.logger.warn(
                  `Failed to update device info for user ${user.id}: `,
                  err,
                ),
              );
          } catch (err) {
            this.logger.warn(
              `Failed to parse device info for user ${user.id}: `,
              err,
            );
          }
        },
      }),
    );
  }
}
