import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

import { User } from 'src/users/entities/users.entity';

export interface RequestWithUser extends Request {
  user: User & { claims: DecodedIdToken }; // non-optional if guard always sets it
}
