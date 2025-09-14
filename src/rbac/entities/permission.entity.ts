import { Permission } from 'src/common/constants/rbac.enum';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('permissions')
export class Permissions {
  @PrimaryColumn({ type: 'varchar' })
  id: Permission; // primary key is the permission name string

  @Column({ nullable: true })
  description?: string;
}
