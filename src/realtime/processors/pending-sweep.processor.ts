// pending-sweep.processor.ts
import { Process, Processor } from '@nestjs/bull';

import { QueueName } from 'src/common/constants/common.enum';
import { RedisService } from 'src/common/redis.service';
import { FirebaseService } from 'src/firebase/services/firebase.service';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { RealtimeQueueService } from '../services/realtime-queue.service';

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
            // Added deviceId
            const devices = await this.userDeviceService.getDevicesByUserIds([
              userId,
            ]);
            const token = devices.find(
              (d) => d.deviceToken === deviceId,
            )?.deviceToken;
            if (!token) return;
            const {
              userIds: _userIds,
              event,
              payload: {
                data = {},
                wsData: _wsData,
                pushData = {},
                ...notification
              },
              options: _options,
            } = jobPayload;
            const pushFinal = { ...data, ...pushData, event };
            const payload = {
              notification,
              data: pushFinal,
            };
            await this.firebaseService.sendNotificationToDevice(token, payload);
          },
        );
      },
      this.lockTTL,
    );
  }
}
