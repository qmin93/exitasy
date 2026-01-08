'use client';

import { Lock, Sparkles, ArrowRight, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Extended session type with role and buyerStatus
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: 'FOUNDER' | 'BUYER' | 'ADMIN';
  buyerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

interface BuyerLockProps {
  feature: string;
  description?: string;
  requiredPlan?: 'buyer' | 'pro';
  className?: string;
  children?: React.ReactNode;
  // Optional: show different content based on gating state
  pendingContent?: React.ReactNode;
  rejectedContent?: React.ReactNode;
}

// Plan pricing
const PLAN_PRICING = {
  buyer: { price: 49, label: 'Buyer Plan' },
  pro: { price: 99, label: 'Pro Buyer Plan' },
};

// Check if user has buyer access
export function useBuyerAccess() {
  const { data: session, status } = useSession();
  const user = session?.user as ExtendedUser | undefined;

  const isLoading = status === 'loading';
  const isLoggedIn = !!session;
  const role = user?.role;
  const buyerStatus = user?.buyerStatus;

  // Access granted if:
  // 1. User is ADMIN (always has access)
  // 2. User is BUYER with APPROVED status
  const hasAccess = role === 'ADMIN' || (role === 'BUYER' && buyerStatus === 'APPROVED');
  const isPending = role === 'BUYER' && buyerStatus === 'PENDING';
  const isRejected = role === 'BUYER' && buyerStatus === 'REJECTED';
  const isFounder = role === 'FOUNDER';

  return {
    isLoading,
    isLoggedIn,
    hasAccess,
    isPending,
    isRejected,
    isFounder,
    role,
    buyerStatus,
  };
}

export function BuyerLock({
  feature,
  description,
  requiredPlan = 'buyer',
  className,
  children,
  pendingContent,
  rejectedContent,
}: BuyerLockProps) {
  const { isLoading, isLoggedIn, hasAccess, isPending, isRejected, isFounder } = useBuyerAccess();
  const plan = PLAN_PRICING[requiredPlan];

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse bg-gray-50', className)}>
        <CardContent className="p-6">
          <div className="h-32 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user has access, show the content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Pending buyer state
  if (isPending) {
    return (
      <Card className={cn(
        'relative overflow-hidden border-2 border-dashed border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50',
        className
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-20 animate-pulse" />
              <div className="relative p-4 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full shadow-lg shadow-yellow-200">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Verification in Progress
            </h3>

            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Your buyer application is being reviewed. You'll get access to {feature} once approved.
            </p>

            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white mb-4">
              <Clock className="h-3 w-3 mr-1" />
              Pending Review
            </Badge>

            {pendingContent || (
              <p className="text-xs text-muted-foreground mt-3">
                Usually takes 24-48 hours. We'll email you when approved.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejected buyer state
  if (isRejected) {
    return (
      <Card className={cn(
        'relative overflow-hidden border-2 border-dashed border-red-200 bg-gradient-to-br from-red-50 to-rose-50',
        className
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="relative mb-4">
              <div className="relative p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-lg shadow-red-200">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Application Not Approved
            </h3>

            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Unfortunately, your buyer application wasn't approved. Contact support for more info.
            </p>

            {rejectedContent || (
              <Button variant="outline" asChild>
                <Link href="/support">Contact Support</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Founder state - prompt to switch to buyer
  if (isFounder) {
    return (
      <Card className={cn(
        'relative overflow-hidden border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50',
        className
      )}>
        <CardContent className="p-6">
          {children && (
            <div className="relative">
              <div className="blur-sm opacity-50 pointer-events-none">
                {children}
              </div>
            </div>
          )}

          <div className={cn(
            'flex flex-col items-center justify-center text-center py-8',
            children && 'absolute inset-0 bg-white/80 backdrop-blur-sm'
          )}>
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-20 animate-pulse" />
              <div className="relative p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full shadow-lg shadow-purple-200">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {feature}
            </h3>

            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              You're logged in as a Founder. To access deal details, apply as a Buyer.
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-200 gap-2"
              asChild
            >
              <Link href="/apply-buyer">
                Apply as Buyer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: Not logged in or not a buyer - show upgrade prompt
  return (
    <Card className={cn(
      'relative overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100',
      className
    )}>
      <CardContent className="p-6">
        {children && (
          <div className="relative">
            <div className="blur-sm opacity-50 pointer-events-none">
              {children}
            </div>
          </div>
        )}

        <div className={cn(
          'flex flex-col items-center justify-center text-center py-8',
          children && 'absolute inset-0 bg-white/80 backdrop-blur-sm'
        )}>
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-20 animate-pulse" />
            <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-200">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {feature}
          </h3>

          {description && (
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              {description}
            </p>
          )}

          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {plan.label} Feature
          </Badge>

          {!isLoggedIn ? (
            <>
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 gap-2"
                asChild
              >
                <Link href="/api/auth/signin">
                  Sign In to Continue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Sign in and apply as a buyer to access deal details.
              </p>
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 gap-2"
                asChild
              >
                <Link href="/apply-buyer">
                  Apply as Buyer
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                {requiredPlan === 'buyer'
                  ? 'DM founders, detailed data, email alerts'
                  : 'Early access, revenue graphs, comparisons'
                }
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Inline lock badge for small elements
export function BuyerLockBadge({
  requiredPlan = 'buyer',
  size = 'default'
}: {
  requiredPlan?: 'buyer' | 'pro';
  size?: 'sm' | 'default';
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border-green-200 text-green-700 bg-green-50',
        size === 'sm' && 'text-[10px] py-0 h-5'
      )}
    >
      <Lock className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />
      {requiredPlan === 'pro' ? 'Pro' : 'Buyer'}
    </Badge>
  );
}

// For inline text with lock
export function LockedText({
  children,
  requiredPlan = 'buyer'
}: {
  children: React.ReactNode;
  requiredPlan?: 'buyer' | 'pro';
}) {
  const { hasAccess } = useBuyerAccess();

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Lock className="h-3 w-3 text-green-600" />
      <span className="blur-sm select-none">{children}</span>
      <BuyerLockBadge requiredPlan={requiredPlan} size="sm" />
    </span>
  );
}

// Gated tab trigger - shows lock icon if user doesn't have access
export function GatedTabTrigger({
  children,
  className,
  isLocked = false,
}: {
  children: React.ReactNode;
  className?: string;
  isLocked?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {children}
      {isLocked && <Lock className="h-3.5 w-3.5 text-green-600" />}
    </div>
  );
}
