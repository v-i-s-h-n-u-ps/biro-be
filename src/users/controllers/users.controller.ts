import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { UserResponseDto } from 'src/common/dtos/user-response.dto';
import { type RequestWithUser } from 'src/common/types/request-with-user';
import { Roles } from 'src/rbac/decorators/roles.decorator';
import { RolesGuard } from 'src/rbac/guards/roles.guard';

import { UpdateUserRolesDto } from '../dtos/update-user-roles.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    const user = await this.usersService.findByFirebaseUid(
      req.user.firebaseUid,
    );
    return plainToInstance(UserResponseDto, user, { strategy: 'excludeAll' });
  }

  @Patch('me')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body()
    body: Partial<{
      name: string;
      email: string;
      phone: string;
    }>,
  ) {
    const user = await this.usersService.updateProfile(req.user.id, body);
    return plainToInstance(UserResponseDto, user, { strategy: 'excludeAll' });
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
}
