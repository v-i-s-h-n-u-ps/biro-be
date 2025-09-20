import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type Request } from 'express';

import { Roles } from 'src/authorization/rbac/decorators/roles.decorator';
import { Role } from 'src/common/constants/rbac.enum';
import { UserBasicDetailsDto } from 'src/common/dtos/user-basic-details.dto';
import { UserResponseDto } from 'src/common/dtos/user-response.dto';

import { UserProfileResponseDto } from '../dtos/responses/user-profile-response.dto';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import { UpdateUserRolesDto } from '../dtos/update-user-roles.dto';
import { SuggestionService } from '../services/suggestion.service';
import { UserProfileService } from '../services/user-profile.service';
import { UsersService } from '../services/users.service';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly suggestionService: SuggestionService,
    private readonly userProfileService: UserProfileService,
  ) {}

  @Get(':id')
  async getUserProfile(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userProfileService.getProfile(id);
    return plainToInstance(UserProfileResponseDto, user, {
      strategy: 'excludeAll',
    });
  }

  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const user = await this.userProfileService.getProfile(req.user.id);
    return plainToInstance(UserProfileResponseDto, user, {
      strategy: 'excludeAll',
    });
  }

  @Patch()
  async updateProfile(@Req() req: Request, @Body() dto: UpdateUserProfileDto) {
    return this.userProfileService.updateProfile(req.user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
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

  @Get('suggestions')
  async getSuggestions(@Req() req: Request) {
    const suggestion = await this.suggestionService.getSuggestions(req.user.id);
    return suggestion.map((user) =>
      plainToInstance(UserBasicDetailsDto, user, { strategy: 'excludeAll' }),
    );
  }
}
