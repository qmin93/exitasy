'use client';

import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BuyerLockProps {
  feature: string;
  description?: string;
  requiredPlan?: 'buyer' | 'pro';
  className?: string;
  children?: React.ReactNode;
}

// Plan pricing
const PLAN_PRICING = {
  buyer: { price: 49, label: 'Buyer Plan' },
  pro: { price: 99, label: 'Pro Buyer Plan' },
};

export function BuyerLock({
  feature,
  description,
  requiredPlan = 'buyer',
  className,
  children,
}: BuyerLockProps) {
  const plan = PLAN_PRICING[requiredPlan];

  return (
    <Card className={cn(
      'relative overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100',
      className
    )}>
      <CardContent className="p-6">
        {/* Blur overlay for children content */}
        {children && (
          <div className="relative">
            <div className="blur-sm opacity-50 pointer-events-none">
              {children}
            </div>
          </div>
        )}

        {/* Lock overlay */}
        <div className={cn(
          'flex flex-col items-center justify-center text-center py-8',
          children && 'absolute inset-0 bg-white/80 backdrop-blur-sm'
        )}>
          {/* Lock icon with glow */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-20 animate-pulse" />
            <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-200">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Feature name */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {feature}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              {description}
            </p>
          )}

          {/* Plan badge */}
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {plan.label} Feature
          </Badge>

          {/* Upgrade CTA */}
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 gap-2"
          >
            Upgrade for ${plan.price}/mo
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* What's included hint */}
          <p className="text-xs text-muted-foreground mt-3">
            {requiredPlan === 'buyer'
              ? 'DM founders, detailed data, email alerts'
              : 'Early access, revenue graphs, comparisons'
            }
          </p>
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
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Lock className="h-3 w-3 text-green-600" />
      <span className="blur-sm select-none">{children}</span>
      <BuyerLockBadge requiredPlan={requiredPlan} size="sm" />
    </span>
  );
}
