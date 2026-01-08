'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Target, CheckCircle, DollarSign, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface TrendingStartup {
  id: string;
  name: string;
  slug: string;
  upvoteCount: number;
  trendScore?: number;
  trendDetails?: {
    upvotes7d: number;
    comments7d: number;
    guesses7d: number;
    recencyBonus: number;
  };
  whyTrending?: string;
}

interface ForSaleStartup {
  id: string;
  name: string;
  slug: string;
  askingPrice: number | null;
  saleMultiple: number | null;
}

interface TopGuesser {
  rank: number;
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  accuracy: number;
}

interface ForumThread {
  id: string;
  title: string;
  createdAt: string;
  replyCount: number;
}

interface VerifiedStartup {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  lastVerifiedAt?: string;
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const [trendingStartups, setTrendingStartups] = useState<TrendingStartup[]>([]);
  const [forSaleStartups, setForSaleStartups] = useState<ForSaleStartup[]>([]);
  const [topGuessers, setTopGuessers] = useState<TopGuesser[]>([]);
  const [forumThreads, setForumThreads] = useState<ForumThread[]>([]);
  const [recentlyVerified, setRecentlyVerified] = useState<VerifiedStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSidebarData() {
      setIsLoading(true);
      try {
        const [trendingRes, forSaleRes, leaderboardRes, forumRes, verifiedRes] = await Promise.all([
          fetch('/api/trending?limit=5&period=7d'),
          fetch('/api/startups?forSale=true&limit=3'),
          fetch('/api/leaderboard?limit=3'),
          fetch('/api/forum?limit=3'),
          fetch('/api/startups?sort=latest&limit=3'),
        ]);

        if (trendingRes.ok) {
          const data = await trendingRes.json();
          setTrendingStartups(data.startups || []);
        }

        if (forSaleRes.ok) {
          const data = await forSaleRes.json();
          setForSaleStartups(data.startups || []);
        }

        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          setTopGuessers(data.users || []);
        }

        if (forumRes.ok) {
          const data = await forumRes.json();
          setForumThreads(data.threads || []);
        }

        if (verifiedRes.ok) {
          const data = await verifiedRes.json();
          setRecentlyVerified(data.startups || []);
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSidebarData();
  }, []);

  return (
    <aside className="w-80 space-y-6">
      {/* Trending This Week */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            Trending This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TooltipProvider>
            {isLoading ? (
              <SidebarSkeleton />
            ) : trendingStartups.length > 0 ? (
              trendingStartups.map((startup, index) => (
                <div key={startup.id} className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors">
                  <Link
                    href={`/startup/${startup.slug}`}
                    className="flex items-center gap-2 flex-1"
                  >
                    <span className="text-sm font-medium text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <span className="font-medium text-sm">{startup.name}</span>
                  </Link>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                        <TrendingUp className="h-3 w-3" />
                        {startup.trendScore ? Math.round(startup.trendScore) : startup.upvoteCount}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[200px]">
                      <p className="font-semibold text-xs mb-1">Why trending?</p>
                      {startup.trendDetails ? (
                        <div className="text-xs space-y-0.5">
                          <p>{startup.trendDetails.upvotes7d} upvotes (×2)</p>
                          <p>{startup.trendDetails.comments7d} comments (×3)</p>
                          <p>{startup.trendDetails.guesses7d} guesses (×1)</p>
                          <p>+{startup.trendDetails.recencyBonus.toFixed(1)} recency bonus</p>
                        </div>
                      ) : (
                        <p className="text-xs">{startup.whyTrending || `${startup.upvoteCount} upvotes this week`}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No startups yet</p>
            )}
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Top Guessers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-purple-500" />
            Top Guessers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <SidebarSkeleton />
          ) : topGuessers.length > 0 ? (
            <>
              {topGuessers.map((guesser) => (
                <Link
                  key={guesser.id}
                  href={`/user/${guesser.username}`}
                  className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {guesser.rank === 1 && '🥇'}
                      {guesser.rank === 2 && '🥈'}
                      {guesser.rank === 3 && '🥉'}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={guesser.image || undefined} />
                      <AvatarFallback>
                        {(guesser.username || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">@{guesser.username}</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    {guesser.accuracy?.toFixed(0)}%
                  </span>
                </Link>
              ))}
              <Link
                href="/leaderboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block mt-2"
              >
                See all →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No guessers yet</p>
          )}
        </CardContent>
      </Card>

      {/* Hot Deals This Week */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-green-500" />
            Hot Deals This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <SidebarSkeleton />
          ) : forSaleStartups.length > 0 ? (
            <>
              {forSaleStartups.map((startup) => (
                <Link
                  key={startup.id}
                  href={`/startup/${startup.slug}`}
                  className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                >
                  <span className="font-medium text-sm">{startup.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      ${((startup.askingPrice || 0) / 1000).toFixed(0)}K
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {startup.saleMultiple || 0}x
                    </Badge>
                  </div>
                </Link>
              ))}
              <Link
                href="/for-sale"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block mt-2"
              >
                Browse all →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No deals available</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Active Discussions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Active Discussions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <SidebarSkeleton />
          ) : forumThreads.length > 0 ? (
            forumThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/${thread.id}`}
                className="block hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md transition-colors"
              >
                <p className="text-sm font-medium line-clamp-1">{thread.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {thread.replyCount} replies ·{' '}
                  {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No discussions yet</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Recently Verified */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Recently Verified
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <SidebarSkeleton />
          ) : recentlyVerified.length > 0 ? (
            recentlyVerified.map((startup) => (
              <Link
                key={startup.id}
                href={`/startup/${startup.slug}`}
                className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
              >
                <span className="font-medium text-sm">{startup.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(startup.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No verified startups yet</p>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
