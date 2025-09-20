import { BullModule, InjectQueue } from '@nestjs/bull';
import { Module, OnModuleInit } from '@nestjs/common';
import { type Queue } from 'bull';

import { QueueName } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { QueuesModule } from 'src/queues/queues.module';
import { RideLocationService } from 'src/rides/services/ride-location.service';
import { UsersModule } from 'src/users/users.module';

import { AppServerGateway } from './gateways/app-server.gateway';
import { ChatGateway } from './gateways/chats.gateway';
import { RideGateway } from './gateways/rides.gateway';
import { AppNotificationProcessor } from './processors/app-notification.processor';
import { ChatProcessor } from './processors/chat.processor';
import { PendingSweepProcessor } from './processors/pending-sweep.processor';
import { RealtimeService } from './services/realtime.service';
import { RealtimeQueueService } from './services/realtime-queue.service';
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
    QueuesModule,
    UsersModule,
    BullModule.registerQueue(
      { name: QueueName.NOTIFICATIONS, defaultJobOptions },
      { name: QueueName.CHAT, defaultJobOptions },
      { name: QueueName.PENDING_SWEEP },
    ),
  ],
  providers: [
    RedisService,
    PresenceService,
    RealtimeService,
    RealtimeQueueService,
    WebsocketService,
    AppServerGateway,
    ChatGateway,
    RideGateway,
    RideLocationService,
    AppNotificationProcessor,
    ChatProcessor,
    PendingSweepProcessor,
  ],
  exports: [RealtimeService, WebsocketService],
})
export class RealtimeModule implements OnModuleInit {
  constructor(
    @InjectQueue(QueueName.PENDING_SWEEP)
    private readonly pendingSweepQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.pendingSweepQueue.add(
      'sweep',
      {},
      {
        repeat: { every: 1000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
