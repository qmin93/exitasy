'use client';

import Link from 'next/link';
import { ChevronUp, MessageSquare, Gamepad2, TrendingUp, CheckCircle, ArrowRight, Flame, DollarSign, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  // Trending
  trendScore?: number | { score: number };
  whyTrending?: string;

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
  variant?: 'default' | 'trending' | 'sale';
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

// Helper to extract trend score from either number or object
function getTrendScoreValue(trendScore?: number | { score: number }): number | undefined {
  if (typeof trendScore === 'number') return trendScore;
  if (trendScore && typeof trendScore === 'object') return trendScore.score;
  return undefined;
}

export function StartupCard({ startup, showRank = false, variant = 'default' }: StartupCardProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(startup.upvoteCount || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get numeric trend score
  const trendScoreValue = getTrendScoreValue(startup.trendScore);

  // Convert uppercase stage from API to lowercase for STAGE_CONFIG
  const stageLower = (startup.stage?.toLowerCase() || 'making_money') as StartupStage;
  const stageConfig = STAGE_CONFIG[stageLower] || STAGE_CONFIG.making_money;
  const isForSale = stageLower === 'for_sale' || stageLower === 'exit_ready';

  // Auto-detect variant based on state
  const effectiveVariant = variant !== 'default' ? variant : isForSale ? 'sale' : showRank ? 'default' : 'trending';

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

  // Get variant-specific styles
  const getCardStyles = () => {
    switch (effectiveVariant) {
      case 'sale':
        return 'hover:border-green-300 hover:shadow-green-100/50';
      case 'trending':
        return 'hover:border-purple-300 hover:shadow-purple-100/50';
      default:
        return 'hover:border-orange-200';
    }
  };

  const getUpvoteStyles = () => {
    if (upvoted) {
      switch (effectiveVariant) {
        case 'sale':
          return 'bg-green-500 text-white border-green-500';
        case 'trending':
          return 'bg-purple-500 text-white border-purple-500';
        default:
          return 'bg-orange-500 text-white border-orange-500';
      }
    }
    switch (effectiveVariant) {
      case 'sale':
        return 'bg-green-50 hover:bg-green-100 text-gray-600 hover:text-green-600 border-green-100';
      case 'trending':
        return 'bg-purple-50 hover:bg-purple-100 text-gray-600 hover:text-purple-600 border-purple-100';
      default:
        return 'bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 border-gray-100';
    }
  };

  const getCtaColor = () => {
    switch (effectiveVariant) {
      case 'sale':
        return 'text-green-600 group-hover:text-green-700';
      case 'trending':
        return 'text-purple-600 group-hover:text-purple-700';
      default:
        return 'text-orange-600 group-hover:text-orange-700';
    }
  };

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 group overflow-hidden",
      getCardStyles(),
      isAnimating && "scale-[1.02] shadow-lg"
    )}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Product Hunt Style Upvote Button - LEFT COLUMN */}
          <button
            onClick={handleUpvote}
            className={cn(
              'flex flex-col items-center justify-center px-4 py-6 border-r transition-all duration-200 min-w-[72px]',
              getUpvoteStyles(),
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
                {Array.isArray(startup.categories) && startup.categories.length > 0 && (
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
                )}

                {/* Quick Actions Row - Primary action based on variant */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {/* For Sale: View Deal is PRIMARY */}
                  {isForSale ? (
                    <>
                      <Link href={`/startup/${startup.slug}`}>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          View Deal
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link href={`/startup/${startup.slug}#interest`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                        >
                          Express Interest
                        </Button>
                      </Link>
                      {/* Secondary actions - subtle */}
                      <div className="flex items-center gap-1 ml-auto opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link href={`/startup/${startup.slug}#guess`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                            <Gamepad2 className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link href={`/startup/${startup.slug}#comments`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Trending/Default: Upvote area is already primary (left column) */}
                      {/* Secondary actions here */}
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

                      {/* Trending Score Info - shows why this is trending */}
                      {trendScoreValue && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-help ml-auto">
                                <Info className="h-3 w-3" />
                                <span>Score: {Math.round(trendScoreValue)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px]">
                              <p className="text-xs font-medium mb-1">Why this score?</p>
                              <p className="text-xs text-muted-foreground">
                                {startup.whyTrending || 'Upvotes×2 + Comments×3 + Guesses + Verified/Sale bonus × Recency'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* View Details - secondary for trending */}
                      {!trendScoreValue && (
                        <Link href={`/startup/${startup.slug}`} className="ml-auto">
                          <span className={cn(
                            'text-xs flex items-center gap-1 transition-colors',
                            getCtaColor()
                          )}>
                            {showRank ? (
                              <>
                                <Flame className="h-3 w-3" />
                                View launch
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                View details
                              </>
                            )}
                            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Link>
                      )}
                    </>
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
