import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/auth/auth.module';
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
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
