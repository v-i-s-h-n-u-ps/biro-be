import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { FirebaseAuthGuard } from 'src/auth/guards/firebase-auth.guard';
import { UserResponseDto } from 'src/common/dtos/user-response.dto';
import { type RequestWithUser } from 'src/common/types/request-with-user';
import { Roles } from 'src/rbac/decorators/roles.decorator';
import { RolesGuard } from 'src/rbac/guards/roles.guard';

import { UserProfileResponseDto } from '../dtos/responses/user-profile-response.dto';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import { UpdateUserRolesDto } from '../dtos/update-user-roles.dto';
import { UserProfileService } from '../services/user-profile.service';
import { UsersService } from '../services/users.service';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userProfileService: UserProfileService,
  ) {}

  @Get(':id')
  async getUserProfile(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = await this.userProfileService.getProfile(id);
    return plainToInstance(UserProfileResponseDto, user, {
      strategy: 'excludeAll',
    });
  }

  @Get()
  async getMyProfile(@Req() req: RequestWithUser) {
    const user = await this.userProfileService.getProfile(req.user.id);
    return plainToInstance(UserProfileResponseDto, user, {
      strategy: 'excludeAll',
    });
  }

  @Patch()
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.userProfileService.updateProfile(req.user.id, dto);
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
