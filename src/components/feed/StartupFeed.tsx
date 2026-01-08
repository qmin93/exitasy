'use client';

import { useState, useEffect } from 'react';
import { Rocket, Calendar, TrendingUp, Flame, Clock, Trophy, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// Stage filter chips with status indicators
const STAGE_FILTERS: { value: FeedFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '✨' },
  { value: 'making_money', label: 'Making Money', icon: '🟢' },
  { value: 'exit_ready', label: 'Exit-Ready', icon: '🟡' },
  { value: 'for_sale', label: 'For Sale', icon: '💰' },
  { value: 'sold', label: 'Sold', icon: '🏆' },
];

export function StartupFeed() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [startups, setStartups] = useState<any[]>([]);
  const [trendingStartups, setTrendingStartups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Build params for main feed
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

        // Fetch main feed and trending in parallel
        const [mainRes, trendingRes] = await Promise.all([
          fetch(`/api/startups?${params.toString()}`),
          // Always fetch trending (independent of time period)
          timePeriod === 'today' || timePeriod === 'yesterday'
            ? fetch('/api/trending?limit=5&period=7d')
            : Promise.resolve(null),
        ]);

        if (!mainRes.ok) throw new Error('Failed to fetch startups');

        const mainData = await mainRes.json();
        setStartups(mainData.startups || []);

        // Set trending data
        if (trendingRes && trendingRes.ok) {
          const trendingData = await trendingRes.json();
          setTrendingStartups(trendingData.startups || []);
        } else {
          setTrendingStartups([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [activeFilter, timePeriod]);

  // Check if today is empty
  const todayIsEmpty = timePeriod === 'today' && startups.length === 0;

  // Get section title based on time period
  const getSectionTitle = () => {
    switch (timePeriod) {
      case 'today':
        return "Today's Launches";
      case 'yesterday':
        return "Yesterday's Launches";
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
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'month':
        return <Calendar className="h-5 w-5 text-indigo-500" />;
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

      {/* Stage Filter Chips - Enhanced with icons */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGE_FILTERS.map((filter) => (
          <Badge
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-colors px-3 py-1.5 text-xs gap-1',
              activeFilter === filter.value
                ? filter.value === 'for_sale'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-orange-500 hover:bg-orange-600'
                : 'hover:bg-muted'
            )}
            onClick={() => setActiveFilter(filter.value)}
          >
            <span>{filter.icon}</span>
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

      {/* Main Content */}
      {!isLoading && !error && (
        <div className="space-y-8">
          {/* Today's Launch Section (when Today has products) */}
          {startups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold text-xl">
                  {getSectionIcon()}
                  {getSectionTitle()}
                  <Badge variant="secondary" className="text-xs">
                    {startups.length}
                  </Badge>
                </h2>
              </div>

              <div className="space-y-3">
                {startups.map((startup, index) => (
                  <StartupCard
                    key={startup.id}
                    startup={{ ...startup, todayRank: timePeriod === 'today' ? index + 1 : undefined }}
                    showRank={timePeriod === 'today'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today Empty State + Trending as Main */}
          {todayIsEmpty && (
            <>
              {/* Compact CTA - Smaller and more subtle */}
              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">No launches today yet</p>
                    <p className="text-xs text-muted-foreground">Be first · Get featured for 24h</p>
                  </div>
                </div>
                <Link href="/submit">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 gap-1.5">
                    <Rocket className="h-4 w-4" />
                    Launch Now
                  </Button>
                </Link>
              </div>

              {/* Trending This Week as Main Section */}
              {trendingStartups.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                          <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="font-bold text-xl flex items-center gap-2">
                            Trending This Week
                            <Badge className="bg-white/20 text-white text-xs">
                              TOP 5
                            </Badge>
                          </h2>
                          <p className="text-sm opacity-90 flex items-center gap-1">
                            Products gaining the most traction right now
                            <Link href="/how-trending-works" className="inline-flex items-center gap-1 hover:underline underline-offset-2">
                              <HelpCircle className="h-3.5 w-3.5" />
                              <span className="text-xs">How it works</span>
                            </Link>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setTimePeriod('week')}
                        className="gap-1"
                      >
                        View all
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Trending Cards with Prominent Ranks */}
                  <div className="space-y-3">
                    {trendingStartups.slice(0, 5).map((startup, index) => (
                      <div key={startup.id} className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white',
                              index === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900'
                                : index === 1
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700'
                                  : index === 2
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-amber-100'
                                    : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                            )}
                          >
                            #{index + 1}
                          </div>
                        </div>
                        <div className="ml-8">
                          <StartupCard startup={{ ...startup }} showRank={false} variant="trending" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Trending This Week Section (when Today has products) */}
          {!todayIsEmpty && timePeriod === 'today' && trendingStartups.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Trending This Week</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      Based on upvotes, comments & activity
                      <Link href="/how-trending-works" className="inline-flex items-center gap-0.5 text-purple-600 hover:underline underline-offset-2">
                        <HelpCircle className="h-3 w-3" />
                        <span>How?</span>
                      </Link>
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimePeriod('week')}
                  className="gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Compact Trending List */}
              <div className="grid grid-cols-1 gap-2">
                {trendingStartups.slice(0, 3).map((startup, index) => (
                  <Link
                    key={startup.id}
                    href={`/startup/${startup.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs',
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm group-hover:text-purple-600 transition-colors truncate">
                        {startup.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{startup.tagline}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {startup.trendScore && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(startup.trendScore)} pts
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Non-Today Empty State */}
          {startups.length === 0 && timePeriod !== 'today' && (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                Try checking a different time period or submit your own startup.
              </p>
              <Link href="/submit">
                <Button className="bg-orange-500 hover:bg-orange-600">Launch Your Startup</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Newsletter CTA */}
      <div id="newsletter" className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-6 text-white">
        <h3 className="font-semibold text-lg mb-2">Get the best of Exitasy in your inbox</h3>
        <p className="text-sm opacity-90 mb-4">
          Weekly: top deals + buyer signals + exits
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
