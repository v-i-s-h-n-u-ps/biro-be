import { Process, Processor } from '@nestjs/bull';

import { DeliveryStrategy, QueueName } from 'src/common/constants/common.enum';
import { RedisService } from 'src/common/redis.service';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import {
  PENDING_SWEEP_INTERVAL_MS,
  REALTIME_RECONNECT_GRACE_MS,
} from '../constants/realtime.constants';
import { RealtimeQueueService } from '../services/realtime-queue.service';
import { getNotificationPayload } from '../utils/payload.helper';

@Processor(QueueName.PENDING_SWEEP) // this queue is used only for the repeatable sweep job
export class PendingSweepProcessor {
  private readonly sweepLockKey = 'pending:sweep:lock';
  private readonly lockTTL = 5000;

  constructor(
    private readonly queueService: RealtimeQueueService,
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
    private readonly redisService: RedisService,
  ) {}

  @Process('sweep')
  async handle() {
    return this.redisService.withLock(
      this.sweepLockKey,
      async () => {
        await this.queueService.sweepExpiredPendingAndFallback(
          async (userId, deviceId, jobPayload) => {
            if (jobPayload.options.strategy === DeliveryStrategy.WS_ONLY)
              return;
            // Added deviceId
            const devices = await this.userDeviceService.getDevicesByUserIds([
              userId,
            ]);
            const token = devices.find(
              (d) => d.deviceToken === deviceId,
            )?.deviceToken;
            if (!token) return;
            const payload = getNotificationPayload(jobPayload);
            await this.firebaseService.sendNotificationToDevice(token, {
              notification: payload.notification,
              data: payload.pushData,
            });
          },
          PENDING_SWEEP_INTERVAL_MS,
          REALTIME_RECONNECT_GRACE_MS,
        );
      },
      this.lockTTL,
    );
  }
}
