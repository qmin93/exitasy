'use client';

import { useState, useEffect } from 'react';
import { Rocket, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StartupCard } from '@/components/startup/StartupCard';
import { StartupFeedSkeleton } from '@/components/startup/StartupCardSkeleton';
import { FeedFilter } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Filter chips
const STAGE_FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'making_money', label: '🟢 Making Money' },
  { value: 'exit_ready', label: '🟡 Exit-Ready' },
  { value: 'for_sale', label: '🔵 For Sale' },
  { value: 'sold', label: '🟣 Recently Sold' },
];

interface FeedSectionProps {
  title: string;
  icon: React.ReactNode;
  startups: any[];
  showRank?: boolean;
  collapsible?: boolean;
}

function FeedSection({
  title,
  icon,
  startups,
  showRank = false,
  collapsible = false,
}: FeedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (startups.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-lg">
          {icon}
          {title}
        </h2>
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {startups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} showRank={showRank} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StartupFeed() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [startups, setStartups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStartups() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (activeFilter !== 'all') {
          const stageMap: Record<string, string> = {
            making_money: 'MAKING_MONEY',
            exit_ready: 'EXIT_READY',
            for_sale: 'FOR_SALE',
            sold: 'SOLD',
          };
          params.set('stage', stageMap[activeFilter] || activeFilter);
        }
        params.set('limit', '20');

        const res = await fetch(`/api/startups?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch startups');

        const data = await res.json();
        setStartups(data.startups || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStartups();
  }, [activeFilter]);

  // Filter startups (already filtered by API, but keep for client-side filtering)
  const filteredStartups = startups;

  // Group by date (simplified: today, yesterday, earlier)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const todayStartups = filteredStartups.filter((s) => {
    const launchDate = new Date(s.launchDate);
    launchDate.setHours(0, 0, 0, 0);
    return launchDate.getTime() >= today.getTime();
  });

  const yesterdayStartups = filteredStartups.filter((s) => {
    const launchDate = new Date(s.launchDate);
    launchDate.setHours(0, 0, 0, 0);
    return (
      launchDate.getTime() >= yesterday.getTime() &&
      launchDate.getTime() < today.getTime()
    );
  });

  const lastWeekStartups = filteredStartups.filter((s) => {
    const launchDate = new Date(s.launchDate);
    launchDate.setHours(0, 0, 0, 0);
    return (
      launchDate.getTime() >= lastWeek.getTime() &&
      launchDate.getTime() < yesterday.getTime()
    );
  });

  const olderStartups = filteredStartups.filter((s) => {
    const launchDate = new Date(s.launchDate);
    launchDate.setHours(0, 0, 0, 0);
    return launchDate.getTime() < lastWeek.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGE_FILTERS.map((filter) => (
          <Badge
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-colors px-3 py-1',
              activeFilter === filter.value
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'hover:bg-muted'
            )}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && <StartupFeedSkeleton count={5} />}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredStartups.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
            <Rocket className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No startups found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {activeFilter === 'all'
              ? "Be the first to share your startup with the community!"
              : "No startups match this filter. Try a different category."}
          </p>
          <Link href="/submit">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Submit Your Startup
            </Button>
          </Link>
        </div>
      )}

      {/* Feed Sections */}
      {!isLoading && !error && filteredStartups.length > 0 && (
      <div className="space-y-8">
        {/* Today */}
        <FeedSection
          title="Top Products Launching Today"
          icon={<Rocket className="h-5 w-5 text-orange-500" />}
          startups={todayStartups}
          showRank
        />

        {todayStartups.length > 0 && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              See all of today&apos;s products →
            </Button>
          </div>
        )}

        <Separator />

        {/* Yesterday */}
        <FeedSection
          title="Yesterday's Top Products"
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          startups={yesterdayStartups}
          collapsible
        />

        {yesterdayStartups.length > 0 && <Separator />}

        {/* Last Week */}
        <FeedSection
          title="Last Week's Top Products"
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          startups={lastWeekStartups}
          collapsible
        />

        {lastWeekStartups.length > 0 && <Separator />}

        {/* Older (Last Month) */}
        <FeedSection
          title="Last Month's Top Products"
          icon={<Sparkles className="h-5 w-5 text-purple-500" />}
          startups={olderStartups}
          collapsible
        />
      </div>
      )}

      {/* Newsletter CTA */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-6 text-white">
        <h3 className="font-semibold text-lg mb-2">
          Get the best of Exitasy directly in your inbox
        </h3>
        <p className="text-sm opacity-90 mb-4">
          Weekly digest of trending startups, hot deals, and exit stories.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 rounded-md text-foreground bg-white"
          />
          <Button variant="secondary">Subscribe</Button>
        </div>
      </div>
    </div>
  );
}
