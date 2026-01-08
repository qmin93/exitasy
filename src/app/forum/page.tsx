'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  TrendingUp,
  Users,
  Pin,
  ChevronUp,
  Plus,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ForumCategory, FORUM_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  category: ForumCategory;
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface ForumStats {
  totalMembers: number;
  totalThreads: number;
  onlineNow: number;
}

export default function ForumPage() {
  const [activeCategory, setActiveCategory] = useState<ForumCategory | 'all'>(
    'all'
  );
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [stats, setStats] = useState<ForumStats>({ totalMembers: 0, totalThreads: 0, onlineNow: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchThreads() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (activeCategory !== 'all') {
          params.set('category', activeCategory);
        }

        const res = await fetch(`/api/forum?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch threads');

        const data = await res.json();
        setThreads(data.threads || []);
        setStats(data.stats || { totalMembers: 0, totalThreads: 0, onlineNow: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchThreads();
  }, [activeCategory]);

  // Sort: pinned first, then by upvotes (already sorted by API, but keep for safety)
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.upvotes - a.upvotes;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-blue-500" />
                Community Forum
              </h1>
              <Link href="/forum/new">
                <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4" />
                  New Thread
                </Button>
              </Link>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <Badge
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer px-3 py-1',
                  activeCategory === 'all' && 'bg-orange-500 hover:bg-orange-600'
                )}
                onClick={() => setActiveCategory('all')}
              >
                All
              </Badge>
              {(
                Object.entries(FORUM_CATEGORIES) as [
                  ForumCategory,
                  { label: string; emoji: string }
                ][]
              ).map(([key, config]) => (
                <Badge
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer px-3 py-1',
                    activeCategory === key && 'bg-orange-500 hover:bg-orange-600'
                  )}
                  onClick={() => setActiveCategory(key)}
                >
                  {config.emoji} {config.label}
                </Badge>
              ))}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && sortedThreads.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No threads yet. Be the first to start a discussion!</p>
                <Link href="/forum/new">
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                    Create Thread
                  </Button>
                </Link>
              </div>
            )}

            {/* Threads List */}
            {!isLoading && !error && sortedThreads.length > 0 && (
              <div className="space-y-3">
                {sortedThreads.map((thread) => (
                  <Card
                    key={thread.id}
                    className={cn(
                      'hover:shadow-md transition-shadow',
                      thread.isPinned && 'border-orange-200 bg-orange-50/50'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Upvote */}
                        <div className="flex flex-col items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">
                            {thread.upvotes}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.isPinned && (
                              <Pin className="h-4 w-4 text-orange-500" />
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {FORUM_CATEGORIES[thread.category]?.emoji || ''}{' '}
                              {FORUM_CATEGORIES[thread.category]?.label || thread.category}
                            </Badge>
                          </div>

                          <Link
                            href={`/forum/${thread.id}`}
                            className="block hover:underline"
                          >
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {thread.title}
                            </h3>
                          </Link>

                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {thread.content}
                          </p>

                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <Link
                              href={`/user/${thread.user.username}`}
                              className="flex items-center gap-2 hover:text-foreground"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={thread.user.image || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(thread.user.username || 'U').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>@{thread.user.username || 'anonymous'}</span>
                            </Link>
                            <span>·</span>
                            <span>
                              {formatDistanceToNow(new Date(thread.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {thread.replyCount} replies
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {!isLoading && !error && sortedThreads.length > 0 && (
              <div className="text-center mt-6">
                <Button variant="outline">Load more threads</Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 space-y-6">
            {/* Forum Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-blue-500" />
                  Forum Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium">
                    {stats.totalMembers.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threads</span>
                  <span className="font-medium">
                    {stats.totalThreads.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Online now</span>
                  <span className="font-medium text-green-600">{stats.onlineNow}</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors - placeholder for now */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Coming soon
                </p>
              </CardContent>
            </Card>

            <Separator />

            {/* Pinned Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Pin className="h-4 w-4 text-purple-500" />
                  Pinned Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="#"
                  className="block text-sm hover:text-orange-500 transition-colors"
                >
                  • SaaS Valuation Guide
                </Link>
                <Link
                  href="#"
                  className="block text-sm hover:text-orange-500 transition-colors"
                >
                  • Exit Checklist
                </Link>
                <Link
                  href="#"
                  className="block text-sm hover:text-orange-500 transition-colors"
                >
                  • Due Diligence Tips
                </Link>
                <Link
                  href="#"
                  className="block text-sm hover:text-orange-500 transition-colors"
                >
                  • Finding Buyers 101
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
