import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// User role types
type UserRole = 'FOUNDER' | 'BUYER' | 'ADMIN';
type BuyerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      role?: UserRole;
      buyerStatus?: BuyerStatus;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    username?: string;
    role?: UserRole;
    buyerStatus?: BuyerStatus;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    username?: string;
    role?: UserRole;
    buyerStatus?: BuyerStatus;
  }
}
