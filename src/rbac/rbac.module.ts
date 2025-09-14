import { Module } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Permissions } from './entities/permission.entity';
import { Roles } from './entities/role.entity';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { RbacService } from './services/rbac.service';

@Module({
  providers: [
    {
      provide: getRepositoryToken(Roles),
      useFactory: (dataSource: DataSource) => dataSource.getRepository(Roles),
      inject: [DataSource],
    },
    {
      provide: getRepositoryToken(Permissions),
      useFactory: (dataSource: DataSource) =>
        dataSource.getRepository(Permissions),
      inject: [DataSource],
    },
    RbacService,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    RbacService,
    getRepositoryToken(Roles),
    getRepositoryToken(Permissions),
    RolesGuard,
    PermissionsGuard,
  ],
})
export class RbacModule {}
