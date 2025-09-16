import { Module } from '@nestjs/common';

import { RbacModule } from 'src/rbac/rbac.module';
import { UsersModule } from 'src/users/users.module';

import { AuthController } from './controllers/auth.controller';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { AuthService } from './services/auth.service';

@Module({
  imports: [UsersModule, RbacModule],
  providers: [AuthService, FirebaseAuthGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
