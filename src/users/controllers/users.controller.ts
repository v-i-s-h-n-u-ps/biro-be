import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { UserResponseDto } from 'src/common/dtos/user-response.dto';
import { Roles } from 'src/rbac/decorators/roles.decorator';
import { RolesGuard } from 'src/rbac/guards/roles.guard';

import { UpdateUserRolesDto } from '../dtos/update-user-roles.dto';
import { UserProfileResponseDto } from '../dtos/user-profile-response.dto';
import { UsersService } from '../services/users.service';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserProfile(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    return plainToInstance(UserProfileResponseDto, user, {
      strategy: 'excludeAll',
    });
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserRolesDto,
  ) {
    const user = await this.usersService.assignRoles(id, body.roles);
    return plainToInstance(UserResponseDto, user, { strategy: 'excludeAll' });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
