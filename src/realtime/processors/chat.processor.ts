import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { type Job } from 'bull';

import { QueueName } from 'src/common/constants/common.enum';
import { PresenceService } from 'src/common/presence.service';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { RealtimeJob } from '../interfaces/realtime-job.interface';
import { WebsocketService } from '../services/websocket.service';

import { BaseRealtimeProcessor } from './base.processor';

@Processor(QueueName.CHAT)
@Injectable()
export class ChatProcessor extends BaseRealtimeProcessor {
  constructor(
    wsService: WebsocketService,
    presenceService: PresenceService,
    firebaseService: FirebaseService,
    userDeviceService: UserDeviceService,
  ) {
    super(wsService, presenceService, firebaseService, userDeviceService);
  }

  @Process()
  async handle(job: Job<RealtimeJob>) {
    await this.process(job);
  }

  @OnQueueFailed()
  onFailed(job: Job<RealtimeJob>, error: Error) {
    this.logger.error(
      `Chat job failed (id: ${job.id}, event: ${job.data.event}): ${error.message}`,
      error.stack,
    );
  }
}
