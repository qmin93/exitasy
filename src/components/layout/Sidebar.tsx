'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Target, CheckCircle, DollarSign, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

  // Determine which section should be highlighted based on data
  const hasHotDeals = forSaleStartups.length > 0;
  const hasActiveTrending = trendingStartups.length >= 3;

  return (
    <aside className="w-80 space-y-4">
      {/* Trending This Week - Compact with visual emphasis */}
      <Card className={hasActiveTrending ? 'border-purple-200 bg-purple-50/30' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${hasActiveTrending ? 'bg-purple-100' : 'bg-muted'}`}>
                <TrendingUp className={`h-4 w-4 ${hasActiveTrending ? 'text-purple-600' : 'text-orange-500'}`} />
              </div>
              <span>Trending</span>
            </div>
            {hasActiveTrending && (
              <Badge className="bg-purple-100 text-purple-700 text-[10px]">HOT</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            <SidebarSkeleton />
          ) : trendingStartups.length > 0 ? (
            <>
              {trendingStartups.slice(0, 5).map((startup, index) => (
                <Link
                  key={startup.id}
                  href={`/startup/${startup.slug}`}
                  className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-md transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-4 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-600' :
                      'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm truncate max-w-[140px]">{startup.name}</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-[10px] cursor-help">
                          {startup.trendScore ? Math.round(startup.trendScore) : startup.upvoteCount}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[220px]">
                        <p className="text-xs font-medium mb-1">Why Trending?</p>
                        <p className="text-xs text-muted-foreground">
                          {startup.whyTrending || `Upvotes×2 + Comments×3 + Guesses + Verified/Sale Bonus`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Link>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No startups yet</p>
          )}
        </CardContent>
      </Card>

      {/* Top Guessers - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-muted">
              <Target className="h-4 w-4 text-purple-500" />
            </div>
            <span>Top Guessers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
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
                    <span className="text-xs w-4">
                      {guesser.rank === 1 && '🥇'}
                      {guesser.rank === 2 && '🥈'}
                      {guesser.rank === 3 && '🥉'}
                    </span>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={guesser.image || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {(guesser.username || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate max-w-[100px]">@{guesser.username}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                    {guesser.accuracy?.toFixed(0)}%
                  </Badge>
                </Link>
              ))}
              <Link
                href="/leaderboard"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors block mt-1 text-center"
              >
                See leaderboard →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No guessers yet</p>
          )}
        </CardContent>
      </Card>

      {/* Hot Deals This Week - Highlighted when deals exist */}
      <Card className={hasHotDeals ? 'border-green-200 bg-green-50/30' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${hasHotDeals ? 'bg-green-100' : 'bg-muted'}`}>
                <DollarSign className={`h-4 w-4 ${hasHotDeals ? 'text-green-600' : 'text-green-500'}`} />
              </div>
              <span>Hot Deals</span>
            </div>
            {hasHotDeals && (
              <Badge className="bg-green-100 text-green-700 text-[10px]">{forSaleStartups.length} LIVE</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            <SidebarSkeleton />
          ) : forSaleStartups.length > 0 ? (
            <>
              {forSaleStartups.map((startup) => (
                <Link
                  key={startup.id}
                  href={`/startup/${startup.slug}`}
                  className="flex items-center justify-between hover:bg-green-100/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                >
                  <span className="font-medium text-sm truncate max-w-[140px]">{startup.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-green-700">
                      ${((startup.askingPrice || 0) / 1000).toFixed(0)}K
                    </span>
                    <Badge variant="outline" className="text-[10px] border-green-200 text-green-600">
                      {startup.saleMultiple || 0}x
                    </Badge>
                  </div>
                </Link>
              ))}
              <Link
                href="/for-sale"
                className="text-xs text-green-600 hover:text-green-700 transition-colors block mt-1 text-center"
              >
                View all deals →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No deals available</p>
          )}
        </CardContent>
      </Card>

      {/* Active Discussions - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-muted">
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
            <span>Discussions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            <SidebarSkeleton />
          ) : forumThreads.length > 0 ? (
            <>
              {forumThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/${thread.id}`}
                  className="block hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-1">{thread.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {thread.replyCount} replies ·{' '}
                    {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                  </p>
                </Link>
              ))}
              <Link
                href="/forum"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors block mt-1 text-center"
              >
                Join discussions →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No discussions yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recently Verified - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-muted">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <span>Verified</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            <SidebarSkeleton />
          ) : recentlyVerified.length > 0 ? (
            recentlyVerified.map((startup) => (
              <Link
                key={startup.id}
                href={`/startup/${startup.slug}`}
                className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
              >
                <span className="font-medium text-sm truncate max-w-[140px]">{startup.name}</span>
                <span className="text-[10px] text-muted-foreground">
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
