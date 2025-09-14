import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/users.entity';
import { Roles } from 'src/rbac/entities/role.entity';
import { Role } from 'src/common/constants/rbac.enum';
import { RbacService } from 'src/rbac/services/rbac.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly rbacService: RbacService,
  ) {}

  // Create a new user after Firebase signup
  async createUser({
    uid,
    name,
    email,
    phone,
  }: {
    uid: string;
    name: string;
    email?: string;
    phone?: string;
  }) {
    const defaultRole = await this.rbacService.getRole(Role.USER);
    const user = this.userRepo.create({
      uid,
      name,
      email: email ?? undefined,
      phone: phone ?? undefined,
      roles: defaultRole ? [defaultRole] : [],
    });
    return this.userRepo.save(user);
  }

  // Get user by Firebase UID
  async findByUid(uid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { uid } });
  }

  // Get user by database ID
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Update user profile
  async updateProfile(
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'phone'>>,
  ): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  // Assign roles to user (admin only)
  async assignRoles(userId: string, roleIds: Role[]) {
    const user = await this.findById(userId);
    const roles = await this.rbacService.getRolesByIds(roleIds);
    user.roles = roles;
    return this.userRepo.save(user);
  }
}
