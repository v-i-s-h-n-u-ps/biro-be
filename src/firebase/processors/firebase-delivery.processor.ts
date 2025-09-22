// firebase-delivery.processor.ts
import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { type Job } from 'bull';

import { QueueName } from 'src/common/constants/common.enum';
import { UserDeviceService } from 'src/users/services/user-devices.service';

import { FIREBASE_DELIVERY_ATTEMPTS } from '../constants/firebase-queue.constant';
import { FirebaseDeliveryJob } from '../interfaces/firebase-delivery.interface';
import { FirebaseService } from '../services/firebase.service';

@Processor(QueueName.FIREBASE_DELIVERY)
@Injectable()
export class FirebaseDeliveryProcessor {
  private readonly logger = new Logger(FirebaseDeliveryProcessor.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userDeviceService: UserDeviceService,
  ) {}

  @Process({ name: 'deliver', concurrency: 5 })
  async handleDelivery(job: Job<FirebaseDeliveryJob>) {
    const jobData = job.data;

    const result = await this.firebaseService.processDeliveryJob(jobData);

    // Clean up invalid tokens from database
    if (result.failedTokens.length > 0) {
      const invalidTokens = this.firebaseService.cleanupInvalidTokens(
        result.failedTokens,
      );
      if (invalidTokens.length > 0) {
        await this.userDeviceService.removeDevicesByTokens(invalidTokens);
      }
    }

    // If there are failures and we should retry
    if (
      result.failedTokens.length > 0 &&
      (jobData.attempt || 1) < FIREBASE_DELIVERY_ATTEMPTS
    ) {
      const retryableTokens = result.failedTokens
        .filter(({ error }) => this.firebaseService.isRetryableError(error))
        .map(({ token }) => token);

      if (retryableTokens.length > 0) {
        throw new Error(`Retry needed for ${retryableTokens.length} tokens`);
      }
    }

    return result;
  }

  @OnQueueFailed()
  onFailed(job: Job<FirebaseDeliveryJob>, error: Error) {
    this.logger.error(
      `Firebase delivery job failed (id: ${job.id}, attempt: ${job.data.attempt || 1}): ${error.message}`,
    );

    // Log detailed failure information for monitoring
    const failedTokens = job.data.tokens.length;
    this.logger.warn(
      `Job ${job.id} failed with ${failedTokens} tokens pending delivery`,
    );
  }
}
