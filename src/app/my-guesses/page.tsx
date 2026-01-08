'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface GuessedStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo: string | null;
  currentMRR: number;
  verificationStatus: string;
  categories: string[];
}

interface UserGuess {
  id: string;
  guessedRange: string;
  createdAt: string;
  startup: GuessedStartup;
  actualMRR: number;
  isCorrect: boolean;
}

interface GuessStats {
  totalGuesses: number;
  correctGuesses: number;
  accuracy: string;
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

function getRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    RANGE_0_1K: '$0 - $1K',
    RANGE_1K_5K: '$1K - $5K',
    RANGE_5K_10K: '$5K - $10K',
    RANGE_10K_20K: '$10K - $20K',
    RANGE_20K_50K: '$20K - $50K',
    RANGE_50K_PLUS: '$50K+',
  };
  return labels[range] || range;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 70) return 'text-green-600';
  if (accuracy >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getAccuracyBadge(accuracy: number): string {
  if (accuracy >= 80) return 'MRR Expert';
  if (accuracy >= 60) return 'Sharp Eye';
  if (accuracy >= 40) return 'Getting Better';
  return 'Keep Practicing';
}

export default function MyGuessesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [guesses, setGuesses] = useState<UserGuess[]>([]);
  const [stats, setStats] = useState<GuessStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    async function fetchMyGuesses() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/users/me/guesses');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setGuesses(data.guesses || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error fetching my guesses:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchMyGuesses();
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

  const accuracyNum = stats ? parseFloat(stats.accuracy) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Guesses</h1>
          <p className="text-muted-foreground">
            Track your MRR guessing accuracy and see how well you know indie
            startups
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalGuesses}</p>
                    <p className="text-sm text-muted-foreground">
                      Total Guesses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.correctGuesses}</p>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${getAccuracyColor(accuracyNum)}`}>
                      {stats.accuracy}%
                    </p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {getAccuracyBadge(accuracyNum)}
                    </p>
                    <p className="text-sm text-muted-foreground">Rank</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Guesses List */}
        {guesses.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Guess History</h2>
            {guesses.map((guess) => (
              <Card
                key={guess.id}
                className={`hover:shadow-md transition-shadow border-l-4 ${
                  guess.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <Avatar className="h-14 w-14 rounded-xl">
                      <AvatarImage src={guess.startup.logo || undefined} />
                      <AvatarFallback className="rounded-xl text-lg">
                        {guess.startup.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/startup/${guess.startup.slug}`}
                              className="text-lg font-semibold hover:text-orange-500"
                            >
                              {guess.startup.name}
                            </Link>
                            {guess.isCorrect ? (
                              <Badge className="bg-green-100 text-green-700 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Correct
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 gap-1">
                                <XCircle className="h-3 w-3" />
                                Wrong
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {guess.startup.tagline}
                          </p>
                        </div>

                        {/* Result */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <TrendingUp className="h-4 w-4" />
                            Actual: {formatMRR(guess.actualMRR)}/mo
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(guess.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Guess Details */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Your guess:{' '}
                          </span>
                          <span className="font-medium">
                            {getRangeLabel(guess.guessedRange)}
                          </span>
                        </div>

                        {/* Categories */}
                        <div className="flex gap-1">
                          {guess.startup.categories.slice(0, 2).map((cat) => (
                            <Badge
                              key={cat}
                              variant="secondary"
                              className="text-xs"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="py-16 text-center">
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Guesses Yet</h2>
              <p className="text-muted-foreground mb-6">
                Start guessing MRR on startup pages to track your accuracy!
              </p>
              <Link href="/">
                <Badge className="text-base px-4 py-2 bg-orange-500 hover:bg-orange-600 cursor-pointer">
                  Browse Startups
                </Badge>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
