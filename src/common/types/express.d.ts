import { User } from 'src/users/entities/users.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User & { claims: admin.auth.DecodedIdToken }; // non-optional if guard always sets it
    }
  }
}
