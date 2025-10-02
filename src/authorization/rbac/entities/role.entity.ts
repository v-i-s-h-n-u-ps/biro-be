import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

import { Role } from 'src/common/constants/rbac.enum';

import { Permissions } from './permission.entity';

@Entity('roles')
export class Roles {
  @PrimaryColumn({ type: 'varchar' })
  id: Role;

  @Column({ nullable: false })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Permissions, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permissions[];
}
