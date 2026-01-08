/**
 * Authorization Guard Functions
 *
 * Server-side auth guards for API routes.
 * Usage:
 *   const user = await requireUser();
 *   requireBuyerApproved(user);
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import prisma from './prisma';
import { User, UserRole, BuyerStatus } from '@prisma/client';

// Error types for client handling
export type AuthError =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN_ROLE'
  | 'BUYER_NOT_APPROVED'
  | 'NOT_FOUNDER_OF_STARTUP';

export class AuthorizationError extends Error {
  code: AuthError;

  constructor(code: AuthError, message?: string) {
    super(message || code);
    this.code = code;
    this.name = 'AuthorizationError';
  }
}

/**
 * Require authenticated user
 * @returns User object from database
 * @throws AuthorizationError with code 'UNAUTHENTICATED'
 */
export async function requireUser(): Promise<User> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new AuthorizationError('UNAUTHENTICATED', 'You must be logged in');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new AuthorizationError('UNAUTHENTICATED', 'User not found');
  }

  return user;
}

/**
 * Require user to be an approved buyer
 * @param user User object from requireUser()
 * @throws AuthorizationError with code 'FORBIDDEN_ROLE' or 'BUYER_NOT_APPROVED'
 */
export function requireBuyerApproved(user: User): void {
  if (user.role !== UserRole.BUYER && user.role !== UserRole.ADMIN) {
    throw new AuthorizationError(
      'FORBIDDEN_ROLE',
      'You must be a buyer to access this resource'
    );
  }

  // Admin bypasses buyer approval check
  if (user.role === UserRole.ADMIN) {
    return;
  }

  if (user.buyerStatus !== BuyerStatus.APPROVED) {
    throw new AuthorizationError(
      'BUYER_NOT_APPROVED',
      'Your buyer account is pending approval'
    );
  }
}

/**
 * Require user to be a founder
 * @param user User object from requireUser()
 * @throws AuthorizationError with code 'FORBIDDEN_ROLE'
 */
export function requireFounder(user: User): void {
  if (user.role !== UserRole.FOUNDER && user.role !== UserRole.ADMIN) {
    throw new AuthorizationError(
      'FORBIDDEN_ROLE',
      'You must be a founder to access this resource'
    );
  }
}

/**
 * Require user to be the founder of a specific startup
 * @param user User object from requireUser()
 * @param startupId Startup ID to check ownership
 * @throws AuthorizationError with code 'NOT_FOUNDER_OF_STARTUP'
 */
export async function requireFounderOfStartup(
  user: User,
  startupId: string
): Promise<void> {
  // Admin can access any startup
  if (user.role === UserRole.ADMIN) {
    return;
  }

  const maker = await prisma.startupMaker.findUnique({
    where: {
      startupId_userId: {
        startupId,
        userId: user.id,
      },
    },
  });

  if (!maker) {
    throw new AuthorizationError(
      'NOT_FOUNDER_OF_STARTUP',
      'You are not a founder of this startup'
    );
  }
}

/**
 * Check if user has approved buyer access to a startup
 * @param userId User ID
 * @param startupId Startup ID
 * @returns boolean
 */
export async function hasApprovedAccess(
  userId: string,
  startupId: string
): Promise<boolean> {
  const accessRequest = await prisma.buyerAccessRequest.findUnique({
    where: {
      userId_startupId: {
        userId,
        startupId,
      },
    },
  });

  return accessRequest?.status === 'ACCEPTED';
}

/**
 * Handle AuthorizationError in API routes
 * @param error Error to handle
 * @returns Response object with appropriate status code
 */
export function handleAuthError(error: unknown): Response {
  if (error instanceof AuthorizationError) {
    const statusMap: Record<AuthError, number> = {
      UNAUTHENTICATED: 401,
      FORBIDDEN_ROLE: 403,
      BUYER_NOT_APPROVED: 403,
      NOT_FOUNDER_OF_STARTUP: 403,
    };

    return Response.json(
      { error: error.code, message: error.message },
      { status: statusMap[error.code] }
    );
  }

  console.error('Unexpected error:', error);
  return Response.json(
    { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    { status: 500 }
  );
}
