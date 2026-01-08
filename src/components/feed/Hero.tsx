'use client';

import Link from 'next/link';
import { Search, Rocket, TrendingUp, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export function Hero() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="bg-gradient-to-b from-orange-50 to-white border-b">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto">
          {/* Main Headline - Founder focused */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Show your MRR.{' '}
            <span className="text-orange-500">Get discovered.</span>
          </h1>

          {/* Subheadline - Value prop */}
          <p className="text-xl text-muted-foreground mb-6">
            The only launch platform where verified revenue gets you noticed.
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mb-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Stripe verified
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Real revenue only
            </span>
            <span className="flex items-center gap-1.5">
              <Rocket className="h-4 w-4 text-purple-500" />
              Buyer discovery
            </span>
          </div>

          {/* Primary CTA - Submit Startup */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Link href="/submit">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-200 gap-2"
              >
                <Rocket className="h-5 w-5" />
                Submit Your Startup
              </Button>
            </Link>
            <Link href="/for-sale">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 text-base border-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              >
                Browse Deals
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search startups, founders, categories..."
              className="w-full h-12 pl-12 text-base rounded-full border-2 focus-visible:ring-orange-500"
            />
          </div>

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
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category ? null : category
                  )
                }
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
