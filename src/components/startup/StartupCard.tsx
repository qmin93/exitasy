'use client';

import Link from 'next/link';
import { ChevronUp, MessageSquare, Gamepad2, TrendingUp, CheckCircle, ArrowRight, Flame, DollarSign, Zap, Sparkles, Eye, HelpCircle } from 'lucide-react';
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
          return 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-200';
        case 'trending':
          return 'bg-gradient-to-b from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg shadow-purple-200';
        default:
          return 'bg-gradient-to-b from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg shadow-orange-200';
      }
    }
    switch (effectiveVariant) {
      case 'sale':
        // For Sale: Upvote is secondary, muted styling
        return 'bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 border-gray-100';
      case 'trending':
        // Trending: Upvote is PRIMARY - prominent styling with pulse hint
        return 'bg-gradient-to-b from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-600 hover:text-purple-700 border-purple-200 shadow-inner';
      default:
        return 'bg-gradient-to-b from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-600 hover:text-orange-700 border-orange-200 shadow-inner';
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
          {/* For Trending: This is PRIMARY action. For Sale: Secondary (muted) */}
          <button
            onClick={handleUpvote}
            className={cn(
              'flex flex-col items-center justify-center px-4 py-6 border-r transition-all duration-200 min-w-[80px] relative',
              getUpvoteStyles(),
              isAnimating && 'scale-110',
              // Trending cards get extra visual prominence
              effectiveVariant === 'trending' && !upvoted && 'animate-pulse-subtle'
            )}
          >
            {/* Trending indicator badge */}
            {effectiveVariant === 'trending' && !upvoted && (
              <div className="absolute -top-1 -right-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
              </div>
            )}
            <ChevronUp className={cn(
              'h-7 w-7 transition-transform duration-200',
              upvoted && 'animate-bounce',
              isAnimating && '-translate-y-1',
              effectiveVariant === 'trending' && !upvoted && 'h-8 w-8'
            )} />
            <span className={cn(
              'text-xl font-bold mt-1 transition-all duration-200',
              upvoted ? 'text-white' : effectiveVariant === 'sale' ? 'text-gray-500' : 'text-gray-900',
              isAnimating && 'scale-125',
              effectiveVariant === 'trending' && !upvoted && 'text-2xl text-purple-700'
            )}>
              {upvoteCount}
            </span>
            <span className={cn(
              'text-[10px] uppercase tracking-wide mt-0.5',
              upvoted ? 'opacity-70' : effectiveVariant === 'sale' ? 'opacity-50' : 'opacity-80',
              effectiveVariant === 'trending' && !upvoted && 'font-semibold text-purple-600'
            )}>
              {effectiveVariant === 'trending' && !upvoted ? 'VOTE!' : 'upvote'}
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

                {/* ============================================ */}
                {/* QUICK ACTIONS - 2-Row Layout                */}
                {/* Row 1: Primary actions (Deal/Interest)      */}
                {/* Row 2: Secondary actions (Upvote/Guess)     */}
                {/* ============================================ */}
                <div className="mt-3 pt-3 border-t space-y-2">
                  {isForSale ? (
                    <>
                      {/* ROW 1: PRIMARY - Deal focused */}
                      <div className="flex items-center gap-2">
                        <Link href={`/startup/${startup.slug}`} className="flex-1">
                          <Button
                            size="default"
                            className="w-full h-9 text-sm font-semibold gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md shadow-green-200"
                          >
                            <DollarSign className="h-4 w-4" />
                            View Deal
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/startup/${startup.slug}#interest`}>
                          <Button
                            variant="outline"
                            size="default"
                            className="h-9 px-4 text-sm gap-1.5 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 font-medium"
                          >
                            <Sparkles className="h-4 w-4" />
                            Interest
                          </Button>
                        </Link>
                      </div>
                      {/* ROW 2: SECONDARY - Community actions */}
                      <div className="flex items-center gap-2">
                        <Link href={`/startup/${startup.slug}#guess`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-purple-600">
                            <Gamepad2 className="h-3.5 w-3.5" />
                            Guess
                          </Button>
                        </Link>
                        <Link href={`/startup/${startup.slug}#comments`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-blue-600">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Comment
                          </Button>
                        </Link>
                        {/* Why buy - target buyer hint */}
                        <span className="ml-auto text-[10px] text-green-600 truncate max-w-[140px]">
                          Best for: {startup.categories[0] || 'SaaS'} operators
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ROW 1: Trending info + View Details */}
                      <div className="flex items-center gap-2">
                        {trendScoreValue ? (
                          <>
                            {/* Score with visual indicator */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-50 to-purple-100 rounded-full border border-purple-200">
                              <Zap className="h-3.5 w-3.5 text-purple-500" />
                              <span className="text-sm font-bold text-purple-700">{Math.round(trendScoreValue)}</span>
                            </div>
                            {/* Why trending */}
                            <span className="text-[11px] text-muted-foreground truncate flex-1">
                              {startup.whyTrending || `${startup.upvoteCount} upvotes this week`}
                            </span>
                            {/* How trending works link */}
                            <Link href="/how-trending-works" className="flex-shrink-0">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-purple-500 hover:text-purple-700 gap-1">
                                <HelpCircle className="h-3 w-3" />
                                <span className="hidden sm:inline">How?</span>
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            {startup.upvoteCount} upvotes · {startup._count?.guesses ?? 0} guesses
                          </span>
                        )}
                        {/* View Details */}
                        <Link href={`/startup/${startup.slug}`} className="ml-auto flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 font-medium"
                          >
                            <Eye className="h-3 w-3" />
                            Details
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                      {/* ROW 2: SECONDARY - Community actions + Why watch hook */}
                      <div className="flex items-center gap-2">
                        <Link href={`/startup/${startup.slug}#guess`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 font-medium"
                          >
                            <Gamepad2 className="h-3.5 w-3.5" />
                            Guess & Compete
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
                        {/* Why watch hook - acquisition potential hint */}
                        <span className="ml-auto text-[10px] text-orange-600 truncate max-w-[160px]">
                          {startup.growthMoM > 20
                            ? `🔥 ${startup.growthMoM}% MoM growth`
                            : startup.currentMRR >= 5000
                              ? `💰 ${formatMRR(startup.currentMRR)} proven revenue`
                              : `✨ Early ${startup.categories[0] || 'SaaS'} opportunity`}
                        </span>
                      </div>
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
