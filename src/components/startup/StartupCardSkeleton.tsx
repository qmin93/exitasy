'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StartupCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Upvote Button Skeleton */}
          <div className="flex flex-col items-center">
            <Skeleton className="h-14 w-12 rounded-md" />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              {/* Logo Skeleton */}
              <Skeleton className="h-12 w-12 rounded-lg" />

              {/* Info Skeleton */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Title */}
                <Skeleton className="h-5 w-40" />
                {/* Tagline */}
                <Skeleton className="h-4 w-64" />
                {/* Badges */}
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                {/* Stats */}
                <div className="flex gap-4 mt-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StartupFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <StartupCardSkeleton key={i} />
      ))}
    </div>
  );
}
