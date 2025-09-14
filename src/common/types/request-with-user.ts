import { Request } from 'express';

import { User } from 'src/users/entities/users.entity';

export interface RequestWithUser extends Request {
  user: User; // non-optional if guard always sets it
}
