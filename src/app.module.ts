import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from 'config/database.config';
import { validationSchema } from 'config/types';
import { LoggerModule } from 'nestjs-pino';

import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { PresenceService } from './common/presence.service';
import { RedisService } from './common/redis.service';
import { ConnectionsModule } from './connections/connections.module';
import { FirebaseModule } from './firebase/firebase.module';
import { QueueClientFactory } from './queues/providers/queue-client-factory.provider';
import { QueuesModule } from './queues/queues.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RideModule } from './rides/rides.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppGuard } from './app.guard';
import { AppService } from './app.service';

@Module({
  imports: [
    AuthenticationModule,
    AuthorizationModule,
    FirebaseModule,
    UsersModule,
    QueuesModule,
    RealtimeModule,
    ConnectionsModule,
    RideModule,
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
    BullModule.forRootAsync({
      imports: [QueuesModule],
      useFactory: (factory: QueueClientFactory): BullModuleOptions => ({
        prefix: 'QUEUE',
        createClient: (_type, options) =>
          factory.build({
            ...options,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          }),
      }),
      inject: [QueueClientFactory],
    }),
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validationSchema,
      envFilePath: `.env.local`,
      ignoreEnvFile: process.env.MODE === 'production',
      load: [databaseConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('MODE') === 'production' ? 'info' : 'trace',
          transport:
            config.get('MODE') === 'production'
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { translateTime: 'SYS:standard', singleLine: true },
                },
          timestamp: () => `,"time":"${new Date().toISOString()}"`,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RedisService,
    PresenceService,
    { provide: APP_GUARD, useClass: AppGuard },
  ],
})
export class AppModule {}
