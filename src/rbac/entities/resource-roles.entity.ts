import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

import { ResourceRole } from 'src/common/constants/rbac.enum';

import { Permissions } from './permission.entity';

@Entity('resource_roles')
export class ResourceRoles {
  @PrimaryColumn({ type: 'varchar' })
  id: ResourceRole;

  @Column({ nullable: false })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Permissions, { eager: true })
  @JoinTable({
    name: 'resource_role_permissions',
    joinColumn: { name: 'resource_role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permissions[];
}
