import { Module } from '@nestjs/common';

import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [RbacModule],
  exports: [RbacModule],
})
export class AuthorizationModule {}
