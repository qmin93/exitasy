'use client';

import Link from 'next/link';
import { ChevronUp, MessageSquare, Gamepad2, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Startup, StartupStage, STAGE_CONFIG } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Extended Startup type to match actual API response (Prisma schema)
interface APIStartup extends Omit<Startup, 'verification' | 'saleDetails' | 'upvotes'> {
  // Flat fields from Prisma schema
  verificationStatus: string;
  verificationProvider?: string;
  askingPrice?: number;
  saleMultiple?: number;
  upvoteCount: number;
  // Prisma _count relation
  _count?: {
    comments: number;
    guesses: number;
    buyerInterests: number;
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

  // Convert uppercase stage from API to lowercase for STAGE_CONFIG
  const stageLower = (startup.stage?.toLowerCase() || 'making_money') as StartupStage;
  const stageConfig = STAGE_CONFIG[stageLower] || STAGE_CONFIG.making_money;
  const isForSale = stageLower === 'for_sale' || stageLower === 'exit_ready';

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (upvoted) {
      setUpvoteCount((prev) => prev - 1);
    } else {
      setUpvoteCount((prev) => prev + 1);
    }
    setUpvoted(!upvoted);
  };

  return (
    <Card className="hover:shadow-lg hover:border-orange-200 transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Upvote Button */}
          <div className="flex flex-col items-center">
            <Button
              variant={upvoted ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex flex-col h-14 w-12 p-0',
                upvoted && 'bg-orange-500 hover:bg-orange-600 border-orange-500'
              )}
              onClick={handleUpvote}
            >
              <ChevronUp className="h-5 w-5" />
              <span className="text-xs font-bold">{upvoteCount}</span>
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              {/* Logo */}
              <Link href={`/startup/${startup.slug}`}>
                <Avatar className="h-12 w-12 rounded-lg cursor-pointer">
                  <AvatarImage src={startup.logo} alt={startup.name} />
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
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
