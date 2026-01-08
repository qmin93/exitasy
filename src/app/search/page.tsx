'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, Users, Rocket, Filter, SortAsc, X, ChevronDown } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SearchStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo: string | null;
  currentMRR: number;
  upvoteCount: number;
  categories: string[];
  makers: {
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  }[];
}

interface SearchUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  _count: {
    startups: number;
  };
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

const CATEGORIES = [
  'SaaS', 'Fintech', 'E-commerce', 'AI/ML', 'DevTools', 'Marketing',
  'Productivity', 'Health', 'Education', 'Social', 'Other'
];

const MRR_RANGES = [
  { label: 'Any', min: '', max: '' },
  { label: '$0 - $1K', min: '0', max: '1000' },
  { label: '$1K - $10K', min: '1000', max: '10000' },
  { label: '$10K - $50K', min: '10000', max: '50000' },
  { label: '$50K+', min: '50000', max: '' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'upvotes', label: 'Most Upvotes' },
  { value: 'mrr', label: 'Highest MRR' },
  { value: 'newest', label: 'Newest First' },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [startups, setStartups] = useState<SearchStartup[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
  const [category, setCategory] = useState<string>('');
  const [mrrRange, setMrrRange] = useState<string>('0');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [forSaleOnly, setForSaleOnly] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  async function handleSearch(searchQuery: string) {
    if (!searchQuery || searchQuery.length < 2) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
        sortBy,
      });

      if (category) params.append('category', category);
      if (forSaleOnly) params.append('forSale', 'true');

      const selectedRange = MRR_RANGES[parseInt(mrrRange)];
      if (selectedRange?.min) params.append('minMRR', selectedRange.min);
      if (selectedRange?.max) params.append('maxMRR', selectedRange.max);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      setStartups(data.startups || []);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch(query);
    // Update URL with search query
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
  }

  function handleApplyFilters() {
    if (query.length >= 2) {
      handleSearch(query);
    }
  }

  function handleClearFilters() {
    setCategory('');
    setMrrRange('0');
    setSortBy('relevance');
    setForSaleOnly(false);
    if (query.length >= 2) {
      // Re-search with cleared filters
      setTimeout(() => handleSearch(query), 0);
    }
  }

  const hasActiveFilters = category || mrrRange !== '0' || sortBy !== 'relevance' || forSaleOnly;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Search</h1>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search startups, users..."
              className="w-full pl-12 h-12 text-lg"
              autoFocus
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600"
              disabled={isLoading || query.length < 2}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </form>

        {/* Filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-6">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {[category, mrrRange !== '0', sortBy !== 'relevance', forSaleOnly].filter(Boolean).length}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          <CollapsibleContent className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* MRR Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">MRR Range</label>
                    <Select value={mrrRange} onValueChange={setMrrRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MRR_RANGES.map((range, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>{range.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* For Sale Only */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    <Button
                      type="button"
                      variant={forSaleOnly ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => setForSaleOnly(!forSaleOnly)}
                    >
                      {forSaleOnly ? '✓ ' : ''}For Sale Only
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleApplyFilters} className="bg-orange-500 hover:bg-orange-600">
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Results */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {!isLoading && hasSearched && (
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All ({startups.length + users.length})
              </TabsTrigger>
              <TabsTrigger value="startups">
                Startups ({startups.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                Users ({users.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Startups Section */}
              {startups.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-orange-500" />
                    Startups
                  </h2>
                  <div className="space-y-3">
                    {startups.slice(0, 5).map((startup) => (
                      <StartupResult key={startup.id} startup={startup} />
                    ))}
                  </div>
                  {startups.length > 5 && (
                    <Button variant="link" className="mt-2">
                      Show all {startups.length} startups
                    </Button>
                  )}
                </div>
              )}

              {/* Users Section */}
              {users.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Users
                  </h2>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <UserResult key={user.id} user={user} />
                    ))}
                  </div>
                  {users.length > 5 && (
                    <Button variant="link" className="mt-2">
                      Show all {users.length} users
                    </Button>
                  )}
                </div>
              )}

              {/* No Results */}
              {startups.length === 0 && users.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="startups" className="space-y-3">
              {startups.map((startup) => (
                <StartupResult key={startup.id} startup={startup} />
              ))}
              {startups.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No startups found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-3">
              {users.map((user) => (
                <UserResult key={user.id} user={user} />
              ))}
              {users.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Initial State */}
        {!isLoading && !hasSearched && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Search for startups and users
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Enter at least 2 characters to search
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function StartupResult({ startup }: { startup: SearchStartup }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Link href={`/startup/${startup.slug}`}>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarImage src={startup.logo || undefined} />
              <AvatarFallback className="rounded-lg">
                {startup.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{startup.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {startup.tagline}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {startup.categories.slice(0, 2).map((cat: string) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">
                {formatMRR(startup.currentMRR)}/mo
              </div>
              <div className="text-xs text-muted-foreground">
                {startup.upvoteCount} upvotes
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

function UserResult({ user }: { user: SearchUser }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Link href={`/user/${user.username}`}>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback>
                {(user.username || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">@{user.username || 'anonymous'}</h3>
              {user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {user.bio}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                {user._count.startups} startup{user._count.startups !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

// Wrap with Suspense for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
