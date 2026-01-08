'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  BadgeCheck,
  Heart,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

// Placeholder data when less than 3 real startups
const PLACEHOLDER_STARTUPS: ForSaleStartup[] = [
  {
    id: 'placeholder-1',
    name: 'Your SaaS Here',
    slug: 'submit',
    tagline: 'List your startup for sale',
    logo: null,
    currentMRR: 5000,
    askingPrice: 150000,
    saleMultiple: 30,
    isVerified: false,
    upvoteCount: 0,
    commentCount: 0,
  },
  {
    id: 'placeholder-2',
    name: 'Coming Soon',
    slug: 'for-sale',
    tagline: 'More deals arriving daily',
    logo: null,
    currentMRR: 3000,
    askingPrice: 90000,
    saleMultiple: 30,
    isVerified: false,
    upvoteCount: 0,
    commentCount: 0,
  },
  {
    id: 'placeholder-3',
    name: 'List Yours',
    slug: 'submit',
    tagline: 'Get discovered by buyers',
    logo: null,
    currentMRR: 8000,
    askingPrice: 240000,
    saleMultiple: 30,
    isVerified: false,
    upvoteCount: 0,
    commentCount: 0,
  },
];

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

interface ForSaleCardProps {
  startup: ForSaleStartup;
  isPlaceholder?: boolean;
}

function ForSaleCard({ startup, isPlaceholder = false }: ForSaleCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(startup.upvoteCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaceholder) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
  };

  return (
    <Link
      href={isPlaceholder ? `/${startup.slug}` : `/startup/${startup.slug}`}
      className="flex-shrink-0 w-[300px] group"
    >
      <Card
        className={cn(
          'h-full transition-all duration-200 border-2',
          isPlaceholder
            ? 'border-dashed border-green-200 bg-green-50/30 hover:border-green-400 hover:bg-green-50/50'
            : 'border-green-100 hover:shadow-lg hover:border-green-300 hover:shadow-green-100/50'
        )}
      >
        <CardContent className="p-5">
          {/* Header: Logo + Name + Verified */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={startup.logo || undefined} />
              <AvatarFallback
                className={cn(
                  'rounded-xl text-lg font-bold',
                  isPlaceholder
                    ? 'bg-green-100 text-green-400'
                    : 'bg-green-100 text-green-700'
                )}
              >
                {isPlaceholder ? '?' : startup.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3
                  className={cn(
                    'font-semibold truncate',
                    isPlaceholder && 'text-green-600'
                  )}
                >
                  {startup.name}
                </h3>
                {startup.isVerified && (
                  <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {startup.tagline}
              </p>
            </div>
          </div>

          {/* MRR & Price Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="flex items-center gap-1 text-blue-600 text-xs mb-1">
                <TrendingUp className="h-3 w-3" />
                MRR
              </div>
              <div className="font-bold text-base">
                {isPlaceholder ? '???' : `${formatMRR(startup.currentMRR)}/mo`}
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <div className="flex items-center gap-1 text-green-600 text-xs mb-1">
                <DollarSign className="h-3 w-3" />
                Asking
              </div>
              <div className="font-bold text-base text-green-700">
                {isPlaceholder
                  ? '???'
                  : startup.askingPrice
                    ? formatPrice(startup.askingPrice)
                    : 'Contact'}
              </div>
            </div>
          </div>

          {/* Multiple + Like/Comment */}
          <div className="flex items-center justify-between pt-3 border-t">
            {startup.saleMultiple && !isPlaceholder ? (
              <Badge
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200"
              >
                {startup.saleMultiple}x multiple
              </Badge>
            ) : (
              <div />
            )}
            {!isPlaceholder ? (
              <div className="flex items-center gap-2">
                {/* Like Button with interaction */}
                <button
                  onClick={handleLike}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200',
                    liked
                      ? 'bg-red-100 text-red-600'
                      : 'hover:bg-red-50 text-muted-foreground hover:text-red-500',
                    isAnimating && 'scale-110'
                  )}
                >
                  <Heart
                    className={cn(
                      'h-3.5 w-3.5 transition-all',
                      liked && 'fill-red-500 text-red-500',
                      isAnimating && 'animate-ping'
                    )}
                  />
                  <span className={cn(liked && 'font-medium')}>{likeCount}</span>
                </button>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {startup.commentCount}
                </span>
              </div>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                List yours
              </Badge>
            )}
          </div>

          {/* View Details CTA */}
          <div className="mt-3 pt-3 border-t border-dashed">
            <span className="text-xs text-green-600 group-hover:text-green-700 flex items-center gap-1 justify-center">
              {isPlaceholder ? 'Submit your startup' : 'View deal details'}
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
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

  // Fill with placeholders to always show at least 3 cards
  const displayStartups = [...startups];
  const placeholdersNeeded = Math.max(0, 3 - startups.length);
  const placeholders = PLACEHOLDER_STARTUPS.slice(0, placeholdersNeeded);

  return (
    <section className="w-full mb-10">
      {/* Section Header - More prominent */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Recently Listed for Sale</h2>
            <p className="text-sm text-muted-foreground">
              Profitable SaaS businesses looking for new owners
            </p>
          </div>
        </div>
        <Link href="/for-sale">
          <Button
            variant="outline"
            className="gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
          >
            View All Deals
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-green-50/50 rounded-2xl border-2 border-dashed border-green-200">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
          {/* Real startups */}
          {displayStartups.map((startup) => (
            <ForSaleCard key={startup.id} startup={startup} />
          ))}
          {/* Placeholder cards */}
          {placeholders.map((placeholder) => (
            <ForSaleCard
              key={placeholder.id}
              startup={placeholder}
              isPlaceholder
            />
          ))}
        </div>
      )}
    </section>
  );
}
