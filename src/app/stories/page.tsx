'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Trophy, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SoldStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string | null;
  currentMRR: number;
  askingPrice: number | null;
  saleMultiple: number | null;
  categories: string[];
  updatedAt: string;
  makers: {
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }[];
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

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

export default function StoriesPage() {
  const [soldStartups, setSoldStartups] = useState<SoldStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSoldStartups() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/startups?stage=SOLD&limit=50');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSoldStartups(data.startups || []);
      } catch (err) {
        console.error('Error fetching sold startups:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSoldStartups();
  }, []);

  // Calculate stats
  const totalExits = soldStartups.length;
  const totalValue = soldStartups.reduce((sum, s) => sum + (s.askingPrice || 0), 0);
  const avgMultiple =
    soldStartups.length > 0
      ? soldStartups.reduce((sum, s) => sum + (s.saleMultiple || 0), 0) / soldStartups.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 mb-8 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">Exit Stories</h1>
            <p className="text-lg opacity-90 mb-6">
              Inspiring stories of indie hackers who successfully sold their startups.
              Learn from their journeys and get inspired for your own exit.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold">{totalExits}</div>
                <div className="text-sm opacity-75">Successful Exits</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {totalValue > 0 ? formatPrice(totalValue) : '$0'}
                </div>
                <div className="text-sm opacity-75">Total Exit Value</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {avgMultiple > 0 ? `${avgMultiple.toFixed(1)}x` : 'N/A'}
                </div>
                <div className="text-sm opacity-75">Avg Multiple</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {/* Stories List */}
        {!isLoading && soldStartups.length > 0 && (
          <div className="space-y-6">
            {soldStartups.map((startup) => (
              <Card key={startup.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Link href={`/startup/${startup.slug}`}>
                    <div className="flex items-start gap-6">
                      {/* Logo */}
                      <Avatar className="h-20 w-20 rounded-xl">
                        <AvatarImage src={startup.logo || undefined} />
                        <AvatarFallback className="rounded-xl text-2xl">
                          {startup.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-xl font-bold">{startup.name}</h2>
                              <Badge className="bg-green-100 text-green-700">
                                <Trophy className="h-3 w-3 mr-1" />
                                Sold
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{startup.tagline}</p>
                          </div>

                          {/* Sale Price */}
                          {startup.askingPrice && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {formatPrice(startup.askingPrice)}
                              </div>
                              {startup.saleMultiple && (
                                <div className="text-sm text-muted-foreground">
                                  {startup.saleMultiple}x multiple
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Description preview */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {startup.description.slice(0, 200)}...
                        </p>

                        {/* Meta */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Categories */}
                            <div className="flex gap-1">
                              {startup.categories.slice(0, 2).map((cat) => (
                                <Badge key={cat} variant="secondary" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>

                            {/* MRR at sale */}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4" />
                              {formatMRR(startup.currentMRR)}/mo at sale
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDistanceToNow(new Date(startup.updatedAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>

                          {/* Seller */}
                          {startup.makers[0] && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={startup.makers[0].user.image || undefined}
                                />
                                <AvatarFallback className="text-xs">
                                  {(startup.makers[0].user.username || 'U')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                by @{startup.makers[0].user.username}
                              </span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && soldStartups.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Exit Stories Yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to share your startup exit story with the community!
            </p>
            <Link href="/submit">
              <Badge className="text-base px-4 py-2 bg-orange-500 hover:bg-orange-600 cursor-pointer">
                Submit Your Startup
              </Badge>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
