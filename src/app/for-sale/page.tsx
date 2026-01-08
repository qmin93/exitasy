'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, DollarSign, TrendingUp, Users, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ForSaleStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo: string | null;
  currentMRR: number;
  growthMoM: number;
  askingPrice: number | null;
  saleMultiple: number | null;
  saleIncludes: string[];
  saleReason: string | null;
  categories: string[];
  buyerInterestCount: number;
  makers: {
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }[];
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

export default function ForSalePage() {
  const [startups, setStartups] = useState<ForSaleStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<string>('all');

  useEffect(() => {
    async function fetchForSaleStartups() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/startups?forSale=true&limit=50');
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

  // Filter and sort startups
  const filteredStartups = startups
    .filter((startup) => {
      if (priceRange === 'all') return true;
      const price = startup.askingPrice || 0;
      switch (priceRange) {
        case 'under50k':
          return price < 50000;
        case '50k-100k':
          return price >= 50000 && price < 100000;
        case '100k-500k':
          return price >= 100000 && price < 500000;
        case 'over500k':
          return price >= 500000;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.askingPrice || 0) - (b.askingPrice || 0);
        case 'price-high':
          return (b.askingPrice || 0) - (a.askingPrice || 0);
        case 'mrr-high':
          return b.currentMRR - a.currentMRR;
        case 'interest':
          return b.buyerInterestCount - a.buyerInterestCount;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Startups For Sale</h1>
          <p className="text-muted-foreground">
            Discover profitable startups looking for new owners
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="mrr-high">Highest MRR</SelectItem>
                <SelectItem value="interest">Most Interest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under50k">Under $50K</SelectItem>
              <SelectItem value="50k-100k">$50K - $100K</SelectItem>
              <SelectItem value="100k-500k">$100K - $500K</SelectItem>
              <SelectItem value="over500k">Over $500K</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {/* Startups Grid */}
        {!isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredStartups.map((startup) => (
              <Card key={startup.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Link href={`/startup/${startup.slug}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-14 w-14 rounded-lg">
                        <AvatarImage src={startup.logo || undefined} />
                        <AvatarFallback className="rounded-lg">
                          {startup.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{startup.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {startup.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Price & MRR */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 text-green-600 text-sm mb-1">
                          <DollarSign className="h-4 w-4" />
                          Asking Price
                        </div>
                        <div className="font-bold text-lg">
                          {startup.askingPrice
                            ? formatPrice(startup.askingPrice)
                            : 'Contact'}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 text-blue-600 text-sm mb-1">
                          <TrendingUp className="h-4 w-4" />
                          Monthly Revenue
                        </div>
                        <div className="font-bold text-lg">
                          {formatMRR(startup.currentMRR)}/mo
                        </div>
                      </div>
                    </div>

                    {/* Sale Multiple */}
                    {startup.saleMultiple && (
                      <div className="text-sm text-muted-foreground mb-3">
                        {startup.saleMultiple}x revenue multiple
                      </div>
                    )}

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {startup.categories.slice(0, 3).map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>

                    {/* Interest & Seller */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {startup.buyerInterestCount} interested
                      </div>
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
                          <span className="text-sm text-muted-foreground">
                            @{startup.makers[0].user.username}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredStartups.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              No startups for sale at the moment
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later or adjust your filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
