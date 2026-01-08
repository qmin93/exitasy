'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            The community where SaaS founders{' '}
            <span className="text-orange-500">flex real revenue.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8">
            No ideas. No promises. Just verified money makers.
          </p>

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
