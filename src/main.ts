import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { DeviceInterceptor } from './users/interceptors/device.interceptor';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );
  app.useGlobalInterceptors(app.get(DeviceInterceptor));

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 5050);
}

bootstrap();
