import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

import { PresenceSocket } from 'src/common/types/socket.types';
import { User } from 'src/users/entities/users.entity';

export function getUser(
  context: ExecutionContext,
  throwIfMissing = false,
): User | undefined {
  const type = context.getType<'http' | 'ws'>();

  let user: User;

  if (type === 'http') {
    user = context.switchToHttp().getRequest<Request>().user;
  } else if (type === 'ws') {
    user = context.switchToWs().getClient<PresenceSocket>().data.user;
  }

  if (throwIfMissing && !user) {
    throw new ForbiddenException('User not authenticated');
  }

  return user;
}
