'use client';

import { useState, useEffect } from 'react';
import { Rocket, Calendar, TrendingUp, Sparkles, Flame, Clock, Trophy, Zap, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
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
  const [fallbackStartups, setFallbackStartups] = useState<any[]>([]); // For when Today is empty
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    async function fetchStartups() {
      setIsLoading(true);
      setError(null);
      setShowFallback(false);
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

        // If Today is empty, fetch This Week as fallback
        if (timePeriod === 'today' && (!data.startups || data.startups.length === 0)) {
          const fallbackParams = new URLSearchParams();
          fallbackParams.set('period', 'week');
          fallbackParams.set('limit', '5');
          if (activeFilter !== 'all') {
            const stageMap: Record<string, string> = {
              making_money: 'MAKING_MONEY',
              exit_ready: 'EXIT_READY',
              for_sale: 'FOR_SALE',
              sold: 'SOLD',
            };
            fallbackParams.set('stage', stageMap[activeFilter] || activeFilter);
          }

          const fallbackRes = await fetch(`/api/startups?${fallbackParams.toString()}`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            setFallbackStartups(fallbackData.startups || []);
            setShowFallback(true);
          }
        }
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

      {/* Empty State with Gamification + Fallback */}
      {!isLoading && !error && startups.length === 0 && (
        <div className="space-y-8">
          {/* Gamified CTA for Today */}
          {timePeriod === 'today' && (
            <Card className="border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="py-10 px-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 mb-4 animate-pulse">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Be Today&apos;s #1 Launch
                </h3>
                <p className="text-muted-foreground mb-3 max-w-md mx-auto">
                  No products launched today yet. Your startup could be featured at the top!
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-orange-600 font-medium mb-6 bg-orange-100 px-4 py-2 rounded-full">
                  <Zap className="h-4 w-4" />
                  First launch today gets featured for 24 hours
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Link href="/submit">
                    <Button size="lg" className="bg-orange-500 hover:bg-orange-600 gap-2 px-8 py-6 text-lg">
                      <Rocket className="h-6 w-6" />
                      Launch Now
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Want to stay updated?{' '}
                    <a href="#newsletter" className="text-orange-600 hover:underline">
                      Subscribe to our newsletter
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Non-Today Empty State */}
          {timePeriod !== 'today' && (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Rocket className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No products found for this period
              </h3>
              <p className="text-muted-foreground mb-4">
                Try checking a different time period or submit your own startup.
              </p>
              <Link href="/submit">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Launch Your Startup
                </Button>
              </Link>
            </div>
          )}

          {/* Fallback: This Week's Trending (only when Today is empty) */}
          {showFallback && fallbackStartups.length > 0 && (
            <div className="space-y-4">
              {/* Prominent Trending Header */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg flex items-center gap-2">
                        Trending This Week
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          While you wait
                        </Badge>
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Top products gaining traction right now
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimePeriod('week')}
                    className="text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50 gap-1"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Trending Cards with Rank Numbers */}
              <div className="space-y-3">
                {fallbackStartups.slice(0, 5).map((startup, index) => (
                  <div key={startup.id} className="relative">
                    {/* Rank Badge */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md",
                        index === 0 ? "bg-yellow-400 text-yellow-900" :
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-amber-600 text-amber-100" :
                        "bg-purple-100 text-purple-700"
                      )}>
                        #{index + 1}
                      </div>
                    </div>
                    <div className="ml-6">
                      <StartupCard
                        startup={{...startup}}
                        showRank={false}
                        variant="trending"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {fallbackStartups.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setTimePeriod('week')}
                    className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    See {fallbackStartups.length - 5} more trending this week
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
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
      <div id="newsletter" className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-6 text-white">
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
