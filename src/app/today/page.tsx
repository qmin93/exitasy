'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StartupCard } from '@/components/startup/StartupCard';
import { StartupFeedSkeleton } from '@/components/startup/StartupCardSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket, Calendar, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimePeriod = 'today' | 'yesterday' | 'week' | 'month';

interface StartupData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string | null;
  website: string;
  screenshots: string[];
  launchDate: string | null;
  upvoteCount: number;
  commentCount: number;
  guessCount: number;
  buyerInterestCount: number;
  verificationStatus: string;
  stage: string;
  currentMRR: number;
  growthMoM: number;
  revenueAge: number;
  todayRank?: number;
  askingPrice?: number;
  saleMultiple?: number;
  saleIncludes?: string[];
  saleReason?: string;
  sellabilityReasons: string[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
  makers: Array<{
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>;
  _count: {
    comments: number;
    guesses: number;
    buyerInterests: number;
    follows?: number;
  };
  trendScore?: number | {
    score: number;
  };
  trendDetails?: {
    upvotes: number;
    comments: number;
    guesses: number;
    recencyBonus: number;
  };
}

function getDateRange(period: TimePeriod): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return { start: yesterday, end: today };
    }
    case 'week': {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: weekAgo, end: today };
    }
    case 'month': {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: monthAgo, end: today };
    }
  }
}

function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'today': return 'Today';
    case 'yesterday': return 'Yesterday';
    case 'week': return 'This Week';
    case 'month': return 'This Month';
  }
}

function getPeriodIcon(period: TimePeriod) {
  switch (period) {
    case 'today': return <Rocket className="h-5 w-5 text-orange-500" />;
    case 'yesterday': return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'week': return <TrendingUp className="h-5 w-5 text-green-500" />;
    case 'month': return <Sparkles className="h-5 w-5 text-purple-500" />;
  }
}

export default function TodayPage() {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('today');
  const [startups, setStartups] = useState<StartupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStartups() {
      setIsLoading(true);
      setError(null);

      try {
        const { start, end } = getDateRange(activePeriod);
        const params = new URLSearchParams({
          period: activePeriod,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          sort: 'trending',
          limit: '50',
        });

        const res = await fetch(`/api/startups/today?${params.toString()}`);
        if (!res.ok) {
          // Fallback to regular startups API
          const fallbackRes = await fetch(`/api/startups?sort=upvotes&limit=20`);
          if (!fallbackRes.ok) throw new Error('Failed to fetch startups');
          const data = await fallbackRes.json();
          setStartups(data.startups || []);
          return;
        }

        const data = await res.json();
        setStartups(data.startups || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStartups();
  }, [activePeriod]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="w-full px-4 py-8">
        <div className="flex gap-8 justify-center items-start mx-auto" style={{ maxWidth: '1100px' }}>
          {/* Main Content */}
          <div className="w-full" style={{ maxWidth: '680px' }}>
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Rocket className="h-6 w-6 text-orange-500" />
                Product Launches
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover the latest products launching on Exitasy
              </p>
            </div>

            {/* Time Period Tabs */}
            <Tabs value={activePeriod} onValueChange={(v) => setActivePeriod(v as TimePeriod)} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="today" className="flex items-center gap-1.5">
                  <Rocket className="h-4 w-4" />
                  Today
                </TabsTrigger>
                <TabsTrigger value="yesterday" className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Yesterday
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  This Week
                </TabsTrigger>
                <TabsTrigger value="month" className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  This Month
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-semibold text-lg">
                {getPeriodIcon(activePeriod)}
                Top Products - {getPeriodLabel(activePeriod)}
              </h2>
              <Badge variant="outline" className="text-xs">
                {startups.length} products
              </Badge>
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
              <div className="text-center py-16 px-4 bg-white rounded-lg border">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
                  <Rocket className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No launches {getPeriodLabel(activePeriod).toLowerCase()}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Be the first to launch your product {activePeriod === 'today' ? 'today' : `during this period`}!
                </p>
                <Link href="/submit">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Submit Your Product
                  </Button>
                </Link>
              </div>
            )}

            {/* Startup List */}
            {!isLoading && !error && startups.length > 0 && (
              <div className="space-y-3">
                {startups.map((startup, index) => (
                  <div key={startup.id} className="relative">
                    {/* Rank Badge for Today */}
                    {activePeriod === 'today' && index < 5 && (
                      <div className="absolute -left-8 top-4 flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                        {index + 1}
                      </div>
                    )}
                    <StartupCard startup={startup} showRank={activePeriod === 'today'} />
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {!isLoading && startups.length >= 20 && (
              <div className="text-center mt-8">
                <Button variant="outline" className="gap-2">
                  Load More
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Newsletter CTA */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-6 text-white mt-8">
              <h3 className="font-semibold text-lg mb-2">
                Get daily launches in your inbox
              </h3>
              <p className="text-sm opacity-90 mb-4">
                Be the first to discover trending products, hot deals, and exit stories.
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

          {/* Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
