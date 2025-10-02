import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  adjectives,
  Config,
  nouns,
  uniqueUsernameGenerator,
} from 'unique-username-generator';

import { RbacService } from 'src/authorization/rbac/services/rbac.service';
import { Role } from 'src/common/constants/rbac.enum';

import { User } from '../entities/users.entity';

const config: Config = {
  dictionaries: [adjectives, nouns],
  style: 'lowerCase',
  ensureUnique: true,
  separator: '.',
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly rbacService: RbacService,
  ) {}

  private async generateUniqueUsername(email?: string): Promise<string> {
    let username = email
      ? uniqueUsernameGenerator({ ...config, seed: email.split('@')[0] })
      : uniqueUsernameGenerator(config);
    if (username.length < 3) username = username + 'user';
    let count = 0;
    let uniqueUsername = username;

    while (
      await this.userRepo.findOne({ where: { username: uniqueUsername } })
    ) {
      count += 1;
      uniqueUsername = uniqueUsernameGenerator({
        ...config,
        randomDigits: count,
        seed: uniqueUsername,
      });
    }

    return uniqueUsername;
  }

  async createUser({
    firebaseUid,
    email,
    phone,
    emailVerified,
  }: {
    firebaseUid: string;
    email?: string;
    phone?: string;
    emailVerified?: boolean;
  }) {
    const defaultRole = await this.rbacService.getRole(Role.User);
    const username = await this.generateUniqueUsername(email);
    const user = this.userRepo.create({
      username,
      firebaseUid,
      email: email ?? undefined,
      phone: phone ?? undefined,
      roles: defaultRole ? [defaultRole] : [],
      emailVerified: emailVerified ?? false,
    });
    return this.userRepo.save(user);
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { firebaseUid } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async assignRoles(userId: string, roleIds: Role[]) {
    const user = await this.findById(userId);
    const roles = await this.rbacService.getRolesByIds(roleIds);
    user.roles = roles;
    return this.userRepo.save(user);
  }

  updateLastLogin(userId: string) {
    return this.userRepo.save({ id: userId, lastLoginAt: new Date() });
  }

  async remove(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }
}
