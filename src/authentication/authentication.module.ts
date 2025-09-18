import { Module } from '@nestjs/common';

import { AuthorizationModule } from 'src/authorization/authorization.module';
import { UsersModule } from 'src/users/users.module';

import { AuthenticationController } from './controllers/authentication.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { WsFirebaseAuthGuard } from './guards/ws-firebase-auth.guard';
import { AuthenticationService } from './services/authentication.service';

@Module({
  imports: [UsersModule, AuthorizationModule],
  providers: [AuthenticationService, FirebaseAuthGuard, WsFirebaseAuthGuard],
  controllers: [AuthenticationController],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
