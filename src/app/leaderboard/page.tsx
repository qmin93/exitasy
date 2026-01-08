'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Target, TrendingUp, DollarSign, Loader2, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STAGE_CONFIG, StartupStage } from '@/types';
import { cn } from '@/lib/utils';

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  accuracy: number;
  totalGuesses: number;
  startupsOwned: number;
}

interface LeaderboardStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  logo: string | null;
  currentMRR: number;
  growthMoM: number;
  upvoteCount: number;
  stage: StartupStage;
  makers: { user: { username: string | null; image: string | null } }[];
}

interface LeaderboardData {
  users: LeaderboardUser[];
  startups: LeaderboardStartup[];
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [startups, setStartups] = useState<LeaderboardStartup[]>([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const [usersRes, startupsRes] = await Promise.all([
          fetch(`/api/leaderboard?type=users&timeRange=${timeRange}`),
          fetch(`/api/leaderboard?type=startups&timeRange=${timeRange}`),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }

        if (startupsRes.ok) {
          const startupsData = await startupsRes.json();
          setStartups(startupsData.startups || []);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [timeRange]);

  // Sort startups by different criteria
  const startupsByUpvotes = [...startups].sort(
    (a, b) => b.upvoteCount - a.upvoteCount
  );
  const startupsByMRR = [...startups]
    .filter((s) => s.currentMRR > 0)
    .sort((a, b) => b.currentMRR - a.currentMRR);
  const startupsByGrowth = [...startups]
    .filter((s) => s.growthMoM > 0)
    .sort((a, b) => b.growthMoM - a.growthMoM);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Exitasy Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Top products and guessers of the week
          </p>
        </div>

        {/* Time Range Filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border p-1 bg-white">
            <Button
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('week')}
              className={cn(
                timeRange === 'week' && 'bg-orange-500 hover:bg-orange-600'
              )}
            >
              This Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('month')}
              className={cn(
                timeRange === 'month' && 'bg-orange-500 hover:bg-orange-600'
              )}
            >
              This Month
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('all')}
              className={cn(
                timeRange === 'all' && 'bg-orange-500 hover:bg-orange-600'
              )}
            >
              All Time
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="w-full justify-center">
              <TabsTrigger value="products" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Products
              </TabsTrigger>
              <TabsTrigger value="guessers" className="gap-2">
                <Target className="h-4 w-4" />
                Top Guessers
              </TabsTrigger>
              <TabsTrigger value="revenue" className="gap-2">
                <DollarSign className="h-4 w-4" />
                By Revenue
              </TabsTrigger>
            </TabsList>

            {/* Top Products by Upvotes */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Top Products by Upvotes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {startupsByUpvotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No products yet. Be the first to submit!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Founder</TableHead>
                          <TableHead className="text-right">MRR</TableHead>
                          <TableHead className="text-right">Growth</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead className="text-right">Upvotes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {startupsByUpvotes.map((startup, index) => (
                          <TableRow key={startup.id}>
                            <TableCell>
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                              {index > 2 && index + 1}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/startup/${startup.slug}`}
                                className="flex items-center gap-3 hover:underline"
                              >
                                <Avatar className="h-8 w-8 rounded-lg">
                                  <AvatarImage src={startup.logo || undefined} />
                                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs">
                                    {startup.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{startup.name}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {startup.tagline}
                                  </div>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              {startup.makers[0]?.user ? (
                                <Link
                                  href={`/user/${startup.makers[0].user.username}`}
                                  className="flex items-center gap-2 hover:underline"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={startup.makers[0].user.image || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {startup.makers[0].user.username?.slice(0, 2).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    @{startup.makers[0].user.username}
                                  </span>
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {startup.currentMRR > 0
                                ? formatMRR(startup.currentMRR)
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {startup.growthMoM > 0 ? (
                                <span className="text-green-600">
                                  +{startup.growthMoM}%
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {STAGE_CONFIG[startup.stage] && (
                                <Badge
                                  className={cn(
                                    'text-xs text-white',
                                    STAGE_CONFIG[startup.stage].color
                                  )}
                                >
                                  {STAGE_CONFIG[startup.stage].emoji}{' '}
                                  {STAGE_CONFIG[startup.stage].label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary" className="font-bold">
                                ▲ {startup.upvoteCount}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Guessers */}
            <TabsContent value="guessers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Top Guessers by Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No guessers yet. Start guessing to join the leaderboard!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">Accuracy</TableHead>
                          <TableHead className="text-right">Total Guesses</TableHead>
                          <TableHead className="text-right">Products</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              {user.rank === 1 && '🥇'}
                              {user.rank === 2 && '🥈'}
                              {user.rank === 3 && '🥉'}
                              {user.rank > 3 && user.rank}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/user/${user.username}`}
                                className="flex items-center gap-3 hover:underline"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.image || undefined} />
                                  <AvatarFallback>
                                    {user.username?.slice(0, 2).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">@{user.username}</div>
                                  {user.name && (
                                    <div className="text-xs text-muted-foreground">
                                      {user.name}
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-green-600 font-bold">
                                {user.accuracy}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{user.totalGuesses}</TableCell>
                            <TableCell className="text-right">{user.startupsOwned}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* By Revenue */}
            <TabsContent value="revenue">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Highest MRR */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Highest MRR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {startupsByMRR.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No revenue data yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {startupsByMRR.slice(0, 5).map((startup, index) => (
                          <Link
                            key={startup.id}
                            href={`/startup/${startup.slug}`}
                            className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-medium w-6">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && `${index + 1}.`}
                              </span>
                              <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={startup.logo || undefined} />
                                <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs">
                                  {startup.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{startup.name}</span>
                            </div>
                            <span className="font-bold text-green-600">
                              {formatMRR(startup.currentMRR)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Fastest Growing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Fastest Growing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {startupsByGrowth.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No growth data yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {startupsByGrowth.slice(0, 5).map((startup, index) => (
                          <Link
                            key={startup.id}
                            href={`/startup/${startup.slug}`}
                            className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-medium w-6">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && `${index + 1}.`}
                              </span>
                              <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={startup.logo || undefined} />
                                <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs">
                                  {startup.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{startup.name}</span>
                            </div>
                            <span className="font-bold text-blue-600">
                              +{startup.growthMoM}% MoM
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
