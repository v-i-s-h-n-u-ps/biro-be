// src/typings/express-custom.d.ts
import * as admin from 'firebase-admin';

import { User } from 'src/users/entities/users.entity';

declare module 'express' {
  interface Request {
    user?: User & { claims: admin.auth.DecodedIdToken };
  }
}
