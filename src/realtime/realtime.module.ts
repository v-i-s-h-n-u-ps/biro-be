import { BullModule, InjectQueue } from '@nestjs/bull';
import { Module, OnModuleInit } from '@nestjs/common';
import { type Queue } from 'bull';

import { QueueName } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';
import { RedisService } from 'src/common/redis.service';
import { QueuesModule } from 'src/queues/queues.module';
import { RideLocationService } from 'src/rides/services/ride-location.service';
import { UsersModule } from 'src/users/users.module';

import {
  PENDING_SWEEP_INTERVAL_MS,
  REALTIME_BACKOFF_DELAY_MS,
  REALTIME_BULL_ATTEMPTS,
} from './constants/realtime.constants';
import { ChatGateway } from './gateways/chats.gateway';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { RideGateway } from './gateways/rides.gateway';
import { AppNotificationProcessor } from './processors/app-notification.processor';
import { ChatProcessor } from './processors/chat.processor';
import { PendingSweepProcessor } from './processors/pending-sweep.processor';
import { RealtimeService } from './services/realtime.service';
import { RealtimeQueueService } from './services/realtime-queue.service';
import { RealtimeStoreService } from './services/realtime-store.service';
import { WebsocketService } from './services/websocket.service';

const defaultJobOptions = {
  attempts: REALTIME_BULL_ATTEMPTS,
  backoff: {
    type: 'exponential',
    delay: REALTIME_BACKOFF_DELAY_MS,
  },
  removeOnComplete: true,
  removeOnFail: 5,
};

@Module({
  imports: [
    QueuesModule,
    UsersModule,
    BullModule.registerQueue(
      { name: QueueName.Notifications, defaultJobOptions },
      { name: QueueName.Chat, defaultJobOptions },
      {
        name: QueueName.PendingSweep,
        defaultJobOptions: { removeOnComplete: true, removeOnFail: false },
      },
    ),
  ],
  providers: [
    RedisService,
    PresenceService,
    RealtimeService,
    RealtimeQueueService,
    WebsocketService,
    NotificationsGateway,
    ChatGateway,
    RideGateway,
    RideLocationService,
    AppNotificationProcessor,
    ChatProcessor,
    PendingSweepProcessor,
    RealtimeStoreService,
  ],
  exports: [RealtimeService, WebsocketService],
})
export class RealtimeModule implements OnModuleInit {
  constructor(
    @InjectQueue(QueueName.PendingSweep)
    private readonly pendingSweepQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.pendingSweepQueue.add(
      'sweep',
      {},
      {
        repeat: { every: PENDING_SWEEP_INTERVAL_MS },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
