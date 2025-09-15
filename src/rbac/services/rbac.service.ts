import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Permission, ResourceRole, Role } from 'src/common/constants/rbac.enum';

import { Permissions } from '../entities/permission.entity';
import { ResourceRoles } from '../entities/resource-roles.entity';
import { Roles } from '../entities/role.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepo: Repository<Roles>,

    @InjectRepository(Permissions)
    private readonly permRepo: Repository<Permissions>,

    @InjectRepository(ResourceRoles)
    private readonly resourceRoleRepo: Repository<ResourceRoles>,
  ) {}

  async getRole(id: Role) {
    return this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
  }

  async getRolesByIds(ids: Role[]) {
    return this.roleRepo.findBy({ id: In(ids) });
  }

  async getAllRoles() {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async getPermission(id: Permission) {
    return this.permRepo.findOne({ where: { id } });
  }

  async getAllPermissions() {
    return this.permRepo.find();
  }

  async getResourceRoles(id: ResourceRole) {
    return this.resourceRoleRepo.find({
      where: { id },
      relations: ['permissions'],
    });
  }

  async assignPermissions(roleId: Role, permissionIds: Permission[]) {
    const role = await this.getRole(roleId);
    if (!role) throw new Error('Role not found');
    const perms = await this.permRepo.findBy({ id: In(permissionIds) });
    role.permissions = perms;
    return this.roleRepo.save(role);
  }
}
