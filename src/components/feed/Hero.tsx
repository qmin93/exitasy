'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Rocket, TrendingUp, CheckCircle, Users, Zap, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const CATEGORY_CHIPS = [
  'AI',
  'Dev Tools',
  'E-commerce',
  'SaaS',
  'No-Code',
  'Analytics',
  'Productivity',
  'Finance',
];

// Trust badge definitions with detailed explanations
const TRUST_BADGES = [
  {
    id: 'verified',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    label: 'Verified Revenue',
    shortLabel: 'Verified',
    tooltip: {
      title: '✓ Stripe Connected',
      description: 'Revenue verified via Stripe Connect snapshot. No self-reported numbers.',
    },
  },
  {
    id: 'real',
    icon: TrendingUp,
    iconColor: 'text-orange-500',
    label: 'Real Revenue Only',
    shortLabel: 'Real MRR',
    tooltip: {
      title: '💰 No Idea-Stage',
      description: 'Only products making real money. No "coming soon" or pre-revenue launches.',
    },
  },
  {
    id: 'buyers',
    icon: Users,
    iconColor: 'text-purple-500',
    label: 'Buyer Discovery',
    shortLabel: 'Buyers',
    tooltip: {
      title: '🤝 Active Buyers',
      description: 'Verified buyers can request intros directly. Your SaaS gets seen by serious acquirers.',
    },
  },
];

export function Hero() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      router.push(`/search?q=${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="bg-gradient-to-b from-orange-50 to-white border-b">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto">
          {/* Main Headline - Founder focused */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Show your MRR.{' '}
            <span className="text-orange-500">Get discovered.</span>
          </h1>

          {/* Subheadline - Exitasy's 3 core pillars */}
          <p className="text-xl text-muted-foreground mb-2">
            Verified revenue · Buyer discovery · Deal signals
          </p>
          <p className="text-base font-medium text-purple-600 mb-1">
            Not likes. Real buyer actions.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            The only platform where real MRR gets you noticed by serious buyers.
          </p>

          {/* Trust badges with tooltips */}
          <TooltipProvider>
            <div className="flex items-center justify-center gap-3 mb-8">
              {TRUST_BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm text-muted-foreground group">
                        <Icon className={cn('h-4 w-4', badge.iconColor)} />
                        <span className="hidden sm:inline">{badge.label}</span>
                        <span className="sm:hidden">{badge.shortLabel}</span>
                        <HelpCircle className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[240px] p-3">
                      <p className="text-xs font-semibold mb-1">{badge.tooltip.title}</p>
                      <p className="text-xs text-muted-foreground">{badge.tooltip.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Primary CTA - Submit Startup */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center justify-center gap-4">
              <Link href="/submit">
                <Button
                  size="lg"
                  className="h-16 px-12 text-xl font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-200 gap-3"
                >
                  <Rocket className="h-7 w-7" />
                  Submit Your Startup
                </Button>
              </Link>
              <Link href="/for-sale">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 px-10 text-xl font-semibold border-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                >
                  Browse Deals
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Get discovered by verified buyers.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search startups, founders, categories..."
              className="w-full h-12 pl-12 pr-24 text-base rounded-full border-2 focus-visible:ring-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 rounded-full px-4"
              disabled={searchQuery.trim().length < 2}
            >
              Search
            </Button>
          </form>

          {/* Category Chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CATEGORY_CHIPS.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all px-4 py-1.5 text-sm',
                  selectedCategory === category
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'hover:bg-orange-50 hover:border-orange-200'
                )}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
