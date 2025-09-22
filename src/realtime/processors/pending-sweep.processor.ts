import { Process, Processor } from '@nestjs/bull';

import { DeliveryStrategy, QueueName } from 'src/common/constants/common.enum';
import { RedisService } from 'src/common/redis.service';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import {
  PENDING_SWEEP_INTERVAL_MS,
  REALTIME_RECONNECT_GRACE_MS,
  REDIS_LOCK_TTL_MS,
} from '../constants/realtime.constants';
import { RealtimeQueueService } from '../services/realtime-queue.service';
import { getNotificationPayload } from '../utils/payload.helper';

@Processor(QueueName.PENDING_SWEEP) // this queue is used only for the repeatable sweep job
export class PendingSweepProcessor {
  constructor(
    private readonly queueService: RealtimeQueueService,
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
    private readonly redisService: RedisService,
  ) {}

  @Process('sweep')
  async handle() {
    return this.redisService.withLock(
      'pending:sweep:lock',
      async () => {
        await this.queueService.sweepExpiredPendingAndFallback(
          async (_, deviceIds, jobPayload) => {
            if (jobPayload.options.strategy === DeliveryStrategy.WS_ONLY)
              return;
            if (!deviceIds.length) return;
            const devices =
              await this.userDeviceService.getDeviceByIds(deviceIds);
            if (!devices.length) return;
            const tokens = devices.map((d) => d.deviceToken);
            const payload = getNotificationPayload(jobPayload);
            await this.firebaseService.sendNotificationToDevices(tokens, {
              notification: payload.notification,
              data: payload.pushData,
            });
          },
          PENDING_SWEEP_INTERVAL_MS,
          REALTIME_RECONNECT_GRACE_MS,
        );
      },
      REDIS_LOCK_TTL_MS,
    );
  }
}
