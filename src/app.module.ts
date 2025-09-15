import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from 'config/database.config';
import { LoggerModule } from 'nestjs-pino';

import { AuthModule } from './auth/auth.module';
import { RedisService } from './common/redis.service';
import { ConnectionsModule } from './connections/connections.module';
import { FirebaseModule } from './firebase/firebase.module';
import { QueueClientFactory } from './queues/providers/queue-client-factory.provider';
import { QueuesModule } from './queues/queues.module';
import { RbacModule } from './rbac/rbac.module';
import { RealtimeModule } from './realtime/realtime.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    FirebaseModule,
    AuthModule,
    RbacModule,
    UsersModule,
    QueuesModule,
    RealtimeModule,
    ConnectionsModule,
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
      isGlobal: true,
      envFilePath: `.env.local`,
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
  providers: [AppService, RedisService],
})
export class AppModule {}
