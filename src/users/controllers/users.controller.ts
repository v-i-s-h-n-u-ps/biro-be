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

import { FirebaseAuthGuard } from 'src/authentication/guards/firebase-auth.guard';
import { Roles } from 'src/authorization/rbac/decorators/roles.decorator';
import { RolesGuard } from 'src/authorization/rbac/guards/roles.guard';
import { UserBasicDetailsDto } from 'src/common/dtos/user-basic-details.dto';
import { UserResponseDto } from 'src/common/dtos/user-response.dto';
import { type RequestWithUser } from 'src/common/types/request-with-user';

import { UserProfileResponseDto } from '../dtos/responses/user-profile-response.dto';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import { UpdateUserRolesDto } from '../dtos/update-user-roles.dto';
import { SuggestionService } from '../services/suggestion.service';
import { UserProfileService } from '../services/user-profile.service';
import { UsersService } from '../services/users.service';

@UseGuards(FirebaseAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly suggestionService: SuggestionService,
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

  @Get('suggestions')
  async getSuggestions(@Req() req: RequestWithUser) {
    const suggestion = await this.suggestionService.getSuggestions(req.user.id);
    return suggestion.map((user) =>
      plainToInstance(UserBasicDetailsDto, user, { strategy: 'excludeAll' }),
    );
  }
}
