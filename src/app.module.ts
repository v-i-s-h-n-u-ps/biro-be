import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from 'config/database.config';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    AuthModule,
    RbacModule,
    UsersModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const dbOptions = config.get<TypeOrmModuleOptions>('database');
        if (!dbOptions) {
          throw new Error('Database configuration not found');
        }
        return dbOptions;
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.local`,
      load: [databaseConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('VERBOSE_LOGGING') ? 'trace' : 'info',
          transport: {
            target: 'pino-pretty',
            options: { translateTime: 'SYS:standard', singleLine: true },
          },
          timestamp: config.get('MODE') === 'local',
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
