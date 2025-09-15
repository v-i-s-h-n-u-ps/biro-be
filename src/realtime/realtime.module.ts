import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { QueueName } from 'src/common/constants/common.enum';
import { RedisService } from 'src/common/redis.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { QueuesModule } from 'src/queues/queues.module';
import { UsersModule } from 'src/users/users.module';

import { WebsocketGateway } from './gateways/websocket.gateway';
import { AppNotificationProcessor } from './processors/app-notification.processor';
import { ChatProcessor } from './processors/chat.processor';
import { RealtimeService } from './services/realtime.service';
import { WebsocketService } from './services/websocket.service';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: 5,
};

@Module({
  imports: [
    FirebaseModule,
    QueuesModule,
    UsersModule,
    BullModule.registerQueue(
      { name: QueueName.NOTIFICATIONS, defaultJobOptions },
      { name: QueueName.CHAT, defaultJobOptions },
    ),
  ],
  providers: [
    RedisService,
    RealtimeService,
    WebsocketService,
    WebsocketGateway,
    AppNotificationProcessor,
    ChatProcessor,
  ],
  exports: [RealtimeService, WebsocketService],
})
export class RealtimeModule {}
