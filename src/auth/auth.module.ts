import { forwardRef, Module } from '@nestjs/common';

import { RbacModule } from 'src/rbac/rbac.module';
import { UsersModule } from 'src/users/users.module';

import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { AuthService } from './services/auth.service';

@Module({
  imports: [forwardRef(() => UsersModule), RbacModule],
  providers: [AuthService, FirebaseAuthGuard],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
