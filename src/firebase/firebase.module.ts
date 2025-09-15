import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

import { FirebaseService } from './services/firebase.service';
import { NotificationHelperService } from './services/notification-helper.service';

@Global()
@Module({
  imports: [ConfigModule],
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
                ?.replace(/\\n/g, '\n'),
            }),
          });
        }
        return admin;
      },
    },
  ],
  exports: ['FIREBASE_ADMIN', FirebaseService, NotificationHelperService],
})
export class FirebaseModule {}
