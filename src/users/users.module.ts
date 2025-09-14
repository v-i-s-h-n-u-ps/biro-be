import { forwardRef, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/auth/auth.module';
import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { RbacModule } from 'src/rbac/rbac.module';

import { UsersController } from './controllers/users.controller';
import { User } from './entities/users.entity';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    RbacModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: APP_GUARD, // apply FirebaseAuthGuard to all routes in this module
      useClass: FirebaseAuthGuard,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
