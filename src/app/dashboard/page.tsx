'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronUp,
  MessageSquare,
  Target,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowRight,
  Rocket,
  Flame,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Startup {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  currentMRR: number;
  stage: string;
  askingPrice: number | null;
  upvoteCount: number;
  commentCount: number;
  guessCount: number;
  buyerInterestCount: number;
  todayRank: number | null;
  createdAt: string;
}

interface AccessRequest {
  id: string;
  status: string;
  message: string;
  budgetRange: string;
  timeline: string;
  buyerType: string;
  linkedinUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    plan: string;
  };
  startup: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

interface ActivityLog {
  id: string;
  type: string;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    image: string | null;
  } | null;
  startup: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface DashboardData {
  startups: Startup[];
  todaySnapshot: {
    upvotesToday: number;
    commentsToday: number;
    guessesToday: number;
    totalUpvotes: number;
    totalComments: number;
    totalGuesses: number;
    totalBuyerInterest: number;
    totalMRR: number;
  };
  buyerPipeline: {
    pending: number;
    approved: number;
    rejected: number;
    requests: AccessRequest[];
  };
  recentActivity: ActivityLog[];
}

const BUDGET_LABELS: Record<string, string> = {
  under_10k: 'Under $10K',
  '10k_25k': '$10K - $25K',
  '25k_50k': '$25K - $50K',
  '50k_100k': '$50K - $100K',
  '100k_plus': '$100K+',
  flexible: 'Flexible',
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: 'ASAP',
  '1_month': '1 month',
  '3_months': '3 months',
  exploring: 'Exploring',
};

const BUYER_TYPE_LABELS: Record<string, string> = {
  first_time: 'First-time buyer',
  serial: 'Serial acquirer',
  portfolio: 'Portfolio builder',
  operator: 'Operator',
  strategic: 'Strategic buyer',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  UPVOTED: <ChevronUp className="h-4 w-4 text-orange-500" />,
  COMMENTED: <MessageSquare className="h-4 w-4 text-blue-500" />,
  GUESSED: <Target className="h-4 w-4 text-purple-500" />,
  INTRO_REQUESTED: <Users className="h-4 w-4 text-green-500" />,
  ACCESS_APPROVED: <CheckCircle className="h-4 w-4 text-green-500" />,
  ACCESS_REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function FounderDashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/founder/dashboard')
        .then((res) => res.json())
        .then((result) => {
          if (result.message) {
            setError(result.message);
          } else {
            setData(result);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load dashboard');
        })
        .finally(() => setIsLoading(false));
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access your founder dashboard.
              </p>
              <Link href="/auth/signin">
                <Button className="bg-orange-500 hover:bg-orange-600">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // No startups
  if (!data || data.startups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <Rocket className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Launch Your First Startup</h2>
              <p className="text-muted-foreground mb-6">
                You don't have any startups yet. Launch one to see your founder dashboard.
              </p>
              <Link href="/submit">
                <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                  <Rocket className="h-4 w-4" />
                  Launch Startup
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const pendingRequests = data.buyerPipeline.requests.filter((r) => r.status === 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Founder Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your startups, buyer interest, and community engagement.
          </p>
        </div>

        {/* ============================================ */}
        {/* TODAY'S SNAPSHOT                            */}
        {/* ============================================ */}
        <Card className="mb-8 border-t-4 border-t-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Today's Snapshot
            </CardTitle>
            <CardDescription>Activity in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {data.todaySnapshot.upvotesToday}
                </div>
                <div className="text-sm text-orange-600/80 flex items-center justify-center gap-1">
                  <ChevronUp className="h-4 w-4" />
                  New Upvotes
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {data.todaySnapshot.commentsToday}
                </div>
                <div className="text-sm text-blue-600/80 flex items-center justify-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  New Comments
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {data.todaySnapshot.guessesToday}
                </div>
                <div className="text-sm text-purple-600/80 flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  New Guesses
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">
                  {data.buyerPipeline.pending}
                </div>
                <div className="text-sm text-green-600/80 flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  Pending Intros
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  Total: {data.todaySnapshot.totalUpvotes} upvotes ·{' '}
                  {data.todaySnapshot.totalComments} comments ·{' '}
                  {data.todaySnapshot.totalGuesses} guesses
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-600">
                  ${(data.todaySnapshot.totalMRR / 1000).toFixed(1)}K Total MRR
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* ============================================ */}
            {/* BUYER PIPELINE                              */}
            {/* ============================================ */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Buyer Pipeline
                    {pendingRequests.length > 0 && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        {pendingRequests.length} new
                      </Badge>
                    )}
                  </CardTitle>
                  <Link href="/dashboard/requests">
                    <Button variant="outline" size="sm" className="gap-1">
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  Intro requests from potential buyers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Pipeline Summary */}
                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">
                      <strong>{data.buyerPipeline.pending}</strong> Pending
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      <strong>{data.buyerPipeline.approved}</strong> Approved
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">
                      <strong>{data.buyerPipeline.rejected}</strong> Rejected
                    </span>
                  </div>
                </div>

                {/* Pending Requests */}
                {pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg hover:border-green-300 transition-colors bg-white"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.user.image || undefined} />
                            <AvatarFallback>
                              {(request.user.username || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                @{request.user.username || 'anonymous'}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {request.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {BUDGET_LABELS[request.budgetRange] || request.budgetRange}
                              </span>
                              <span>{TIMELINE_LABELS[request.timeline] || request.timeline}</span>
                              <span>
                                {formatDistanceToNow(new Date(request.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                          <Link href={`/dashboard/requests/${request.id}`}>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No pending intro requests</p>
                    <p className="text-sm mt-1">
                      New requests from buyers will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* YOUR STARTUPS                               */}
            {/* ============================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-orange-500" />
                  Your Startups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.startups.map((startup) => (
                    <Link
                      key={startup.id}
                      href={`/startup/${startup.slug}`}
                      className="block"
                    >
                      <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-orange-300 transition-colors bg-white">
                        <Avatar className="h-12 w-12 rounded-xl">
                          <AvatarImage src={startup.logo || undefined} />
                          <AvatarFallback className="rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white">
                            {startup.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{startup.name}</h3>
                            {startup.stage === 'FOR_SALE' && (
                              <Badge className="bg-green-500 text-white text-xs">
                                For Sale
                              </Badge>
                            )}
                            {startup.todayRank && startup.todayRank <= 10 && (
                              <Badge className="bg-orange-100 text-orange-700 text-xs">
                                #{startup.todayRank} Today
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />$
                              {(startup.currentMRR / 1000).toFixed(1)}K MRR
                            </span>
                            <span className="flex items-center gap-1">
                              <ChevronUp className="h-3 w-3" />
                              {startup.upvoteCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {startup.commentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {startup.buyerInterestCount} interested
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* ============================================ */}
            {/* RECENT ACTIVITY                             */}
            {/* ============================================ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 15).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="mt-0.5">
                          {ACTIVITY_ICONS[activity.type] || (
                            <Activity className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-muted-foreground">
                            {activity.user?.username ? (
                              <span className="font-medium text-foreground">
                                @{activity.user.username}
                              </span>
                            ) : (
                              'Someone'
                            )}{' '}
                            {activity.type === 'UPVOTED' && 'upvoted'}
                            {activity.type === 'COMMENTED' && 'commented on'}
                            {activity.type === 'GUESSED' && 'guessed MRR on'}
                            {activity.type === 'INTRO_REQUESTED' && 'requested intro to'}
                            {activity.type === 'ACCESS_APPROVED' && 'was approved for'}
                            {activity.type === 'ACCESS_REJECTED' && 'was rejected for'}{' '}
                            {activity.startup && (
                              <Link
                                href={`/startup/${activity.startup.slug}`}
                                className="font-medium text-foreground hover:text-orange-500"
                              >
                                {activity.startup.name}
                              </Link>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/submit">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Rocket className="h-4 w-4" />
                    Launch New Startup
                  </Button>
                </Link>
                <Link href="/dashboard/requests">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Manage Intro Requests
                  </Button>
                </Link>
                <Link href="/how-trending-works">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Flame className="h-4 w-4" />
                    How Trending Works
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
