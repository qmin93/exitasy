'use client';

import Link from 'next/link';
import { ChevronUp, MessageSquare, Gamepad2, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StartupStage, STAGE_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// API Response type for Startup - more flexible than base Startup type
interface APIStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description?: string;
  logo: string | null;
  website?: string;
  screenshots?: string[];
  videoUrl?: string;

  // Revenue fields
  verificationStatus: string;
  verificationProvider?: string;
  currentMRR: number;
  growthMoM: number;
  revenueAge?: number;

  // Stage
  stage: string;
  askingPrice?: number;
  saleMultiple?: number;
  saleIncludes?: string[];
  saleReason?: string;
  sellabilityReasons?: string[];

  // Engagement
  upvoteCount: number;
  commentCount?: number;
  guessCount?: number;
  buyerInterestCount?: number;

  // Meta
  categories: string[];
  createdAt: string | Date;
  updatedAt?: string | Date;
  launchDate?: string | Date | null;
  todayRank?: number;

  // Makers from API response
  makers: Array<{
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }>;

  // Prisma _count relation
  _count?: {
    comments: number;
    guesses: number;
    buyerInterests: number;
    follows?: number;
  };
}

interface StartupCardProps {
  startup: APIStartup;
  showRank?: boolean;
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

export function StartupCard({ startup, showRank = false }: StartupCardProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(startup.upvoteCount || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Convert uppercase stage from API to lowercase for STAGE_CONFIG
  const stageLower = (startup.stage?.toLowerCase() || 'making_money') as StartupStage;
  const stageConfig = STAGE_CONFIG[stageLower] || STAGE_CONFIG.making_money;
  const isForSale = stageLower === 'for_sale' || stageLower === 'exit_ready';

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (upvoted) {
      setUpvoteCount((prev) => prev - 1);
    } else {
      setUpvoteCount((prev) => prev + 1);
    }
    setUpvoted(!upvoted);
  };

  return (
    <Card className={cn(
      "hover:shadow-lg hover:border-orange-200 transition-all duration-200 group overflow-hidden",
      isAnimating && "scale-[1.02] shadow-lg border-orange-300"
    )}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Product Hunt Style Upvote Button - LEFT COLUMN */}
          <button
            onClick={handleUpvote}
            className={cn(
              'flex flex-col items-center justify-center px-4 py-6 border-r transition-all duration-200 min-w-[72px]',
              upvoted
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 border-gray-100',
              isAnimating && 'scale-110'
            )}
          >
            <ChevronUp className={cn(
              'h-6 w-6 transition-transform duration-200',
              upvoted && 'animate-bounce',
              isAnimating && '-translate-y-1'
            )} />
            <span className={cn(
              'text-lg font-bold mt-1 transition-all duration-200',
              upvoted ? 'text-white' : 'text-gray-900',
              isAnimating && 'scale-125'
            )}>
              {upvoteCount}
            </span>
            <span className="text-[10px] uppercase tracking-wide mt-0.5 opacity-70">
              upvote
            </span>
          </button>

          {/* Main Content - RIGHT COLUMN */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start gap-3">
              {/* Logo */}
              <Link href={`/startup/${startup.slug}`}>
                <Avatar className="h-12 w-12 rounded-lg cursor-pointer">
                  <AvatarImage src={startup.logo || undefined} alt={startup.name} />
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold">
                    {startup.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/startup/${startup.slug}`} className="block">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg group-hover:text-orange-600 transition-colors">{startup.name}</h3>
                    {showRank && startup.todayRank && (
                      <Badge variant="secondary" className="text-xs">
                        #{startup.todayRank} TODAY
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-1">
                    {startup.tagline}
                  </p>
                </Link>

                {/* Badges Row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Verified Badge */}
                  {startup.verificationStatus === 'VERIFIED' && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}

                  {/* Stage Badge */}
                  <Badge
                    className={cn(
                      'text-xs text-white',
                      stageConfig.color
                    )}
                  >
                    {stageConfig.emoji} {stageConfig.label}
                  </Badge>

                  {/* For Sale Price */}
                  {isForSale && startup.askingPrice && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      FOR SALE · ${(startup.askingPrice / 1000).toFixed(0)}K · {startup.saleMultiple || 0}x
                    </Badge>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {/* MRR */}
                  {startup.currentMRR > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">
                        {formatMRR(startup.currentMRR)}
                      </span>
                      <span>MRR</span>
                    </div>
                  )}

                  {/* Growth */}
                  {startup.growthMoM > 0 && (
                    <span className="text-green-600 font-medium">
                      +{startup.growthMoM}%
                    </span>
                  )}

                  {/* Comments */}
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{startup._count?.comments ?? startup.commentCount ?? 0}</span>
                  </div>

                  {/* Guesses */}
                  <div className="flex items-center gap-1">
                    <Gamepad2 className="h-3.5 w-3.5" />
                    <span>{startup._count?.guesses ?? startup.guessCount ?? 0} guesses</span>
                  </div>
                </div>

                {/* Categories - Outside of Link to avoid nesting */}
                <div className="flex items-center gap-2 mt-3">
                  {startup.categories.map((category) => (
                    <Link
                      key={category}
                      href={`/category/${category.toLowerCase()}`}
                    >
                      <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        #{category}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Quick Actions Row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Link href={`/startup/${startup.slug}#guess`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                    >
                      <Gamepad2 className="h-3 w-3" />
                      Guess MRR
                    </Button>
                  </Link>
                  <Link href={`/startup/${startup.slug}#comments`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Comment
                    </Button>
                  </Link>
                  {isForSale && (
                    <Link href={`/startup/${startup.slug}#interest`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      >
                        Express Interest
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
