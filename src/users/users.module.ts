import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { RbacModule } from 'src/rbac/rbac.module';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './entities/users.entity';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => RbacModule)],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: APP_GUARD, // apply FirebaseAuthGuard to all routes in this module
      useClass: FirebaseAuthGuard,
    },
    {
      provide: getRepositoryToken(User),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
      inject: [DataSource],
    },
  ],
  exports: [UsersService, getRepositoryToken(User)],
})
export class UsersModule {}
