'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, CheckCircle, DollarSign, Users, Sparkles } from 'lucide-react';
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


interface VerifiedStartup {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  lastVerifiedAt?: string;
}

interface ActiveBuyer {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  plan: string;
  interestedCount: number;
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
  const [recentlyVerified, setRecentlyVerified] = useState<VerifiedStartup[]>([]);
  const [activeBuyers, setActiveBuyers] = useState<ActiveBuyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSidebarData() {
      setIsLoading(true);
      try {
        const [trendingRes, forSaleRes, verifiedRes, buyersRes] = await Promise.all([
          fetch('/api/trending?limit=5&period=7d'),
          fetch('/api/startups?forSale=true&limit=3'),
          fetch('/api/startups?sort=latest&limit=3'),
          fetch('/api/buyers/active?limit=5'),
        ]);

        if (trendingRes.ok) {
          const data = await trendingRes.json();
          setTrendingStartups(data.startups || []);
        }

        if (forSaleRes.ok) {
          const data = await forSaleRes.json();
          setForSaleStartups(data.startups || []);
        }

        if (verifiedRes.ok) {
          const data = await verifiedRes.json();
          setRecentlyVerified(data.startups || []);
        }

        if (buyersRes.ok) {
          const data = await buyersRes.json();
          setActiveBuyers(data.buyers || []);
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
  const hasActiveBuyers = activeBuyers.length > 0;

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


      {/* Hot Deal Signals - Highest buyer intent */}
      <Card className={hasHotDeals ? 'border-green-200 bg-green-50/30' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${hasHotDeals ? 'bg-green-100' : 'bg-muted'}`}>
                <DollarSign className={`h-4 w-4 ${hasHotDeals ? 'text-green-600' : 'text-green-500'}`} />
              </div>
              <span>Hot Deal Signals</span>
            </div>
            {hasHotDeals && (
              <Badge className="bg-green-100 text-green-700 text-[10px]">{forSaleStartups.length} LIVE</Badge>
            )}
          </CardTitle>
          <p className="text-[10px] text-muted-foreground -mt-1">
            Highest buyer intent this week
          </p>
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
                  <span className="font-medium text-sm truncate max-w-[120px]">{startup.name}</span>
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
              {/* Summary stats */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t mt-2">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Intro requests
                </span>
                <span className="flex items-center gap-1">
                  Buyers watching
                </span>
              </div>
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

      {/* Active Buyers - Highlighted when buyers exist */}
      <Card className={hasActiveBuyers ? 'border-purple-200 bg-purple-50/30' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${hasActiveBuyers ? 'bg-purple-100' : 'bg-muted'}`}>
                <Users className={`h-4 w-4 ${hasActiveBuyers ? 'text-purple-600' : 'text-purple-500'}`} />
              </div>
              <span>Active Buyers</span>
            </div>
            {hasActiveBuyers && (
              <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                <Sparkles className="h-3 w-3 mr-1" />
                LOOKING
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            <SidebarSkeleton />
          ) : activeBuyers.length > 0 ? (
            <>
              {activeBuyers.slice(0, 5).map((buyer) => (
                <Link
                  key={buyer.id}
                  href={`/user/${buyer.username}`}
                  className="flex items-center justify-between hover:bg-purple-100/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={buyer.image || undefined} />
                      <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">
                        {(buyer.username || buyer.name || 'B').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm truncate max-w-[120px]">
                        {buyer.name || `@${buyer.username}`}
                      </span>
                      {buyer.plan === 'PRO' && (
                        <span className="text-[9px] text-purple-600">Verified Buyer</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-600">
                    {buyer.interestedCount} interest{buyer.interestedCount !== 1 ? 's' : ''}
                  </Badge>
                </Link>
              ))}
              <div className="pt-2 border-t mt-2">
                <p className="text-[10px] text-muted-foreground text-center">
                  Shown when a buyer expresses interest this week (privacy-safe).
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">No active buyers yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Be the first to explore deals →
              </p>
            </div>
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
