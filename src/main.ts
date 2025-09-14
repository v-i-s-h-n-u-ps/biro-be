import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      // Exclude all extraneous properties by default unless they are specifically
      // exposed in the response entities
      excludeExtraneousValues: true,
    }),
  );

  app.use(helmet());
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
