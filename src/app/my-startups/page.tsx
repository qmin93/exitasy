'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Rocket,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface MyStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo: string | null;
  currentMRR: number;
  growthMoM: number;
  verificationStatus: string;
  stage: string;
  upvoteCount: number;
  commentCount: number;
  guessCount: number;
  categories: string[];
  createdAt: string;
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    MAKING_MONEY: 'Making Money',
    EXIT_READY: 'Exit Ready',
    ACQUISITION_INTEREST: 'Acquisition Interest',
    FOR_SALE: 'For Sale',
    SOLD: 'Sold',
  };
  return labels[stage] || stage;
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    MAKING_MONEY: 'bg-blue-100 text-blue-700',
    EXIT_READY: 'bg-purple-100 text-purple-700',
    ACQUISITION_INTEREST: 'bg-yellow-100 text-yellow-700',
    FOR_SALE: 'bg-orange-100 text-orange-700',
    SOLD: 'bg-green-100 text-green-700',
  };
  return colors[stage] || 'bg-gray-100 text-gray-700';
}

function getVerificationBadge(status: string) {
  if (status === 'VERIFIED') {
    return <Badge className="bg-green-100 text-green-700">Verified</Badge>;
  }
  if (status === 'PENDING') {
    return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
  }
  return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
}

export default function MyStartupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [startups, setStartups] = useState<MyStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/startups/${slug}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete');
      }

      // Remove from local state
      setStartups((prev) => prev.filter((s) => s.slug !== slug));
    } catch (err) {
      console.error('Error deleting startup:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete startup');
    } finally {
      setDeletingSlug(null);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    async function fetchMyStartups() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/users/me');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStartups(data.startups || []);
      } catch (err) {
        console.error('Error fetching my startups:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchMyStartups();
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Startups</h1>
            <p className="text-muted-foreground">
              Manage and track your submitted startups
            </p>
          </div>
          <Link href="/submit">
            <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4" />
              Add New Startup
            </Button>
          </Link>
        </div>

        {/* Startups List */}
        {startups.length > 0 ? (
          <div className="space-y-4">
            {startups.map((startup) => (
              <Card key={startup.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <Avatar className="h-16 w-16 rounded-xl">
                      <AvatarImage src={startup.logo || undefined} />
                      <AvatarFallback className="rounded-xl text-lg">
                        {startup.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/startup/${startup.slug}`}
                              className="text-lg font-semibold hover:text-orange-500"
                            >
                              {startup.name}
                            </Link>
                            {getVerificationBadge(startup.verificationStatus)}
                            <Badge className={getStageColor(startup.stage)}>
                              {getStageLabel(startup.stage)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {startup.tagline}
                          </p>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/startup/${startup.slug}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/startup/${startup.slug}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(startup.slug, startup.name)}
                              disabled={deletingSlug === startup.slug}
                            >
                              {deletingSlug === startup.slug ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            {formatMRR(startup.currentMRR)}/mo
                          </span>
                          {startup.growthMoM > 0 && (
                            <span className="text-green-500">
                              +{startup.growthMoM.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" />
                          {startup.upvoteCount}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          {startup.commentCount}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          {startup.guessCount} guesses
                        </div>
                      </div>

                      {/* Categories & Date */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-1">
                          {startup.categories.slice(0, 3).map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Created{' '}
                          {formatDistanceToNow(new Date(startup.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Startups Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t submitted any startups yet. Share your project with the
              community!
            </p>
            <Link href="/submit">
              <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4" />
                Submit Your First Startup
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
