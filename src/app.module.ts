import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from 'config/database.config';

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
