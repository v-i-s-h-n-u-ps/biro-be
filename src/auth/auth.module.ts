import { forwardRef, Module } from '@nestjs/common';

import { FirebaseModule } from 'src/common/firebase/firebase.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { UsersModule } from 'src/users/users.module';

import { AuthController } from './controllers/auth.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { AuthService } from './services/auth.service';

@Module({
  imports: [forwardRef(() => UsersModule), RbacModule],
  providers: [AuthService, FirebaseAuthGuard, FirebaseModule],
  controllers: [AuthController],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
