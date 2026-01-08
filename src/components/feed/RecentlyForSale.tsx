'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, DollarSign, TrendingUp, BadgeCheck, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ForSaleStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo: string | null;
  currentMRR: number;
  askingPrice: number | null;
  saleMultiple: number | null;
  isVerified: boolean;
  upvoteCount: number;
  commentCount: number;
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(0)}K`;
  }
  return `$${price}`;
}

export function RecentlyForSale() {
  const [startups, setStartups] = useState<ForSaleStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchForSaleStartups() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/startups?forSale=true&limit=6');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStartups(data.startups || []);
      } catch (err) {
        console.error('Error fetching for sale startups:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchForSaleStartups();
  }, []);

  // Don't render section if no startups for sale
  if (!isLoading && startups.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-bold">Recently Listed for Sale</h2>
        </div>
        <Link
          href="/for-sale"
          className="text-sm text-muted-foreground hover:text-orange-500 flex items-center gap-1"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {startups.map((startup) => (
            <Link
              key={startup.id}
              href={`/startup/${startup.slug}`}
              className="flex-shrink-0 w-[280px]"
            >
              <Card className="hover:shadow-lg hover:border-green-200 transition-all duration-200 h-full">
                <CardContent className="p-4">
                  {/* Header: Logo + Name + Verified */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={startup.logo || undefined} />
                      <AvatarFallback className="rounded-lg bg-green-100 text-green-700">
                        {startup.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold truncate">{startup.name}</h3>
                        {startup.isVerified && (
                          <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {startup.tagline}
                      </p>
                    </div>
                  </div>

                  {/* MRR & Price Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-blue-600 text-xs mb-0.5">
                        <TrendingUp className="h-3 w-3" />
                        MRR
                      </div>
                      <div className="font-bold text-sm">
                        {formatMRR(startup.currentMRR)}/mo
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-green-600 text-xs mb-0.5">
                        <DollarSign className="h-3 w-3" />
                        Asking
                      </div>
                      <div className="font-bold text-sm">
                        {startup.askingPrice ? formatPrice(startup.askingPrice) : 'Contact'}
                      </div>
                    </div>
                  </div>

                  {/* Multiple + Social Stats */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {startup.saleMultiple && (
                      <Badge variant="outline" className="text-xs">
                        {startup.saleMultiple}x multiple
                      </Badge>
                    )}
                    {!startup.saleMultiple && <div />}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {startup.upvoteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {startup.commentCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
