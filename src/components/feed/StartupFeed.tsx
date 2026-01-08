'use client';

import { useState, useEffect } from 'react';
import { Rocket, Calendar, TrendingUp, Sparkles, Flame, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StartupCard } from '@/components/startup/StartupCard';
import { StartupFeedSkeleton } from '@/components/startup/StartupCardSkeleton';
import { FeedFilter } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Time period tabs - Product Hunt style
type TimePeriod = 'today' | 'yesterday' | 'week' | 'month';

const TIME_TABS: { value: TimePeriod; label: string; icon: React.ReactNode }[] = [
  { value: 'today', label: 'Today', icon: <Flame className="h-4 w-4" /> },
  { value: 'yesterday', label: 'Yesterday', icon: <Clock className="h-4 w-4" /> },
  { value: 'week', label: 'This Week', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'month', label: 'This Month', icon: <Calendar className="h-4 w-4" /> },
];

// Stage filter chips
const STAGE_FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'making_money', label: '🟢 Making Money' },
  { value: 'exit_ready', label: '🟡 Exit-Ready' },
  { value: 'for_sale', label: '🔵 For Sale' },
  { value: 'sold', label: '🟣 Sold' },
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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
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
        params.set('period', timePeriod);
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
  }, [activeFilter, timePeriod]);

  // Get section title based on time period
  const getSectionTitle = () => {
    switch (timePeriod) {
      case 'today':
        return "Today's Top Products";
      case 'yesterday':
        return "Yesterday's Top Products";
      case 'week':
        return "This Week's Top Products";
      case 'month':
        return "This Month's Top Products";
    }
  };

  const getSectionIcon = () => {
    switch (timePeriod) {
      case 'today':
        return <Flame className="h-5 w-5 text-orange-500" />;
      case 'yesterday':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'week':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'month':
        return <Calendar className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Period Tabs - Product Hunt Style */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        {TIME_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTimePeriod(tab.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              timePeriod === tab.value
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stage Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGE_FILTERS.map((filter) => (
          <Badge
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-colors px-3 py-1.5 text-xs',
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
      {!isLoading && !error && startups.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
            <Rocket className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {timePeriod === 'today'
              ? 'No products launched today yet'
              : `No products found for ${timePeriod}`}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {timePeriod === 'today'
              ? "Be the first to launch today! Submit your startup now."
              : "Try checking a different time period or submit your own startup."}
          </p>
          <Link href="/submit">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Launch Your Startup
            </Button>
          </Link>
        </div>
      )}

      {/* Feed Section - Single list based on time period */}
      {!isLoading && !error && startups.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-semibold text-lg">
            {getSectionIcon()}
            {getSectionTitle()}
            <span className="text-sm font-normal text-muted-foreground">
              ({startups.length} products)
            </span>
          </h2>

          <div className="space-y-3">
            {startups.map((startup, index) => (
              <StartupCard
                key={startup.id}
                startup={{...startup, todayRank: index + 1}}
                showRank={timePeriod === 'today'}
              />
            ))}
          </div>
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
