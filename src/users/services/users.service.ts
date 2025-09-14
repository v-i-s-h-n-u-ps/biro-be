import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from 'src/common/constants/rbac.enum';
import { RbacService } from 'src/rbac/services/rbac.service';

import { User } from '../entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly rbacService: RbacService,
  ) {}

  // Create a new user after Firebase signup
  async createUser({
    firebaseUid,
    name,
    email,
    phone,
    emailVerified,
  }: {
    firebaseUid: string;
    name: string;
    email?: string;
    phone?: string;
    emailVerified?: boolean;
  }) {
    const defaultRole = await this.rbacService.getRole(Role.USER);
    const user = this.userRepo.create({
      firebaseUid,
      name,
      email: email ?? undefined,
      phone: phone ?? undefined,
      roles: defaultRole ? [defaultRole] : [],
      emailVerified: emailVerified ?? false,
    });
    return this.userRepo.save(user);
  }

  // Get user by Firebase UID
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid } });
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

  updateLastLogin(userId: string) {
    return this.userRepo.save({ id: userId, lastLoginAt: new Date() });
  }
}
