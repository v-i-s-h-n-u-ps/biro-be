import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

import { QueueName } from 'src/common/constants/common.enum';

import {
  FIREBASE_DELIVERY_ATTEMPTS,
  FIREBASE_DELIVERY_BACKOFF_MS,
} from './constants/firebase-queue.constant';
import { FirebaseDeliveryProcessor } from './processors/firebase-delivery.processor';
import { FirebaseService } from './services/firebase.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: QueueName.FIREBASE_DELIVERY,
      defaultJobOptions: {
        attempts: FIREBASE_DELIVERY_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: FIREBASE_DELIVERY_BACKOFF_MS,
        },
        removeOnComplete: true,
        removeOnFail: { count: 4_000 },
      },
    }),
  ],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: config.get('FIREBASE_PROJECT_ID'),
              clientEmail: config.get('FIREBASE_CLIENT_EMAIL'),
              privateKey: config
                .get<string>('FIREBASE_PRIVATE_KEY')
                .replace(/\\n/g, '\n'),
            }),
          });
        }
        return admin;
      },
    },
    FirebaseService,
    FirebaseDeliveryProcessor,
  ],
  exports: ['FIREBASE_ADMIN', FirebaseService],
})
export class FirebaseModule {}
