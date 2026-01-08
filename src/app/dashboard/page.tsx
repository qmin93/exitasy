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
  ListChecks,
  Image,
  FileText,
  Globe,
  Sparkles,
  BadgeCheck,
  Percent,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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

interface StartupChecklist {
  id: string;
  name: string;
  slug: string;
  checklist: {
    hasLogo: boolean;
    hasTagline: boolean;
    hasDescription: boolean;
    hasWebsite: boolean;
    isVerified: boolean;
    hasRevenue: boolean;
    hasGrowth: boolean;
    hasForSaleInfo: boolean;
  };
  completionPercent: number;
  verificationStatus: string;
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
  startupsChecklist: StartupChecklist[];
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
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Welcome to Exitasy</h1>
            <p className="text-muted-foreground mt-2">
              The marketplace where profitable startups find their next owner
            </p>
          </div>

          <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Launch Your First Startup</h2>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                List your profitable side project or startup. Get discovered by serious buyers and connect with the community.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Free to list
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Users className="h-3 w-3 mr-1" />
                  Verified buyers
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Eye className="h-3 w-3 mr-1" />
                  Revenue verification
                </Badge>
              </div>
              <Link href="/submit">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 gap-2 shadow-lg shadow-orange-200">
                  <Rocket className="h-5 w-5" />
                  Launch Your Startup
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Getting Started Steps */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-500 mb-2">1</div>
                <h3 className="font-semibold mb-1">List Your Startup</h3>
                <p className="text-sm text-muted-foreground">
                  Add your product details, MRR, and what makes it sellable
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-500 mb-2">2</div>
                <h3 className="font-semibold mb-1">Get Discovered</h3>
                <p className="text-sm text-muted-foreground">
                  Verified buyers browse and express interest in your product
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-500 mb-2">3</div>
                <h3 className="font-semibold mb-1">Connect & Exit</h3>
                <p className="text-sm text-muted-foreground">
                  Review intro requests and connect with serious buyers
                </p>
              </CardContent>
            </Card>
          </div>
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
        {/* KPI CARDS                                   */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Listings</p>
                  <p className="text-3xl font-bold text-orange-700">{data.startups.length}</p>
                </div>
                <div className="p-3 bg-orange-200/50 rounded-full">
                  <Rocket className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-orange-600/70 mt-2">
                {data.startups.filter(s => s.stage === 'FOR_SALE').length} for sale
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Buyer Signals</p>
                  <p className="text-3xl font-bold text-green-700">{data.todaySnapshot.totalBuyerInterest}</p>
                </div>
                <div className="p-3 bg-green-200/50 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-600/70 mt-2">
                {data.buyerPipeline.pending} pending review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total MRR</p>
                  <p className="text-3xl font-bold text-blue-700">
                    ${(data.todaySnapshot.totalMRR / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="p-3 bg-blue-200/50 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-blue-600/70 mt-2">
                Across all listings
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Engagement</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {data.todaySnapshot.totalUpvotes + data.todaySnapshot.totalComments}
                  </p>
                </div>
                <div className="p-3 bg-purple-200/50 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-purple-600/70 mt-2">
                {data.todaySnapshot.upvotesToday + data.todaySnapshot.commentsToday} today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ============================================ */}
        {/* RESPONSE SLA BANNER                         */}
        {/* ============================================ */}
        {pendingRequests.length > 0 && (
          <Card className="mb-6 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-200 rounded-full animate-pulse">
                    <Clock className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-800">
                      You have {pendingRequests.length} pending intro request{pendingRequests.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-yellow-700">
                      Respond within 24-48 hours to keep buyers engaged
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/requests">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900">
                    Review Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================ */}
        {/* TODAY'S SNAPSHOT                            */}
        {/* ============================================ */}
        <Card className="mb-8 border-t-4 border-t-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Today's Activity
            </CardTitle>
            <CardDescription>What happened in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {data.todaySnapshot.upvotesToday}
                </div>
                <div className="text-sm text-orange-600/80 flex items-center justify-center gap-1">
                  <ChevronUp className="h-4 w-4" />
                  Upvotes
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {data.todaySnapshot.commentsToday}
                </div>
                <div className="text-sm text-blue-600/80 flex items-center justify-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {data.todaySnapshot.guessesToday}
                </div>
                <div className="text-sm text-purple-600/80 flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  Guesses
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">
                  {data.buyerPipeline.pending}
                </div>
                <div className="text-sm text-green-600/80 flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  New Intros
                </div>
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

            {/* ============================================ */}
            {/* PROFILE CHECKLIST                          */}
            {/* ============================================ */}
            {data.startupsChecklist && data.startupsChecklist.length > 0 && (
              <Card className="border-t-4 border-t-purple-500">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-purple-500" />
                    Profile Checklist
                  </CardTitle>
                  <CardDescription>
                    Complete your profile to attract more buyers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.startupsChecklist.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/startup/${item.slug}`}
                          className="font-medium text-sm hover:text-purple-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            item.completionPercent === 100
                              ? 'bg-green-100 text-green-700'
                              : item.completionPercent >= 70
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          )}
                        >
                          {item.completionPercent}%
                        </Badge>
                      </div>
                      <Progress value={item.completionPercent} className="h-1.5" />
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded',
                            item.checklist.hasLogo
                              ? 'text-green-700 bg-green-50'
                              : 'text-gray-400 bg-gray-50'
                          )}
                        >
                          {item.checklist.hasLogo ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Image className="h-3 w-3" />
                          )}
                          Logo
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded',
                            item.checklist.hasTagline
                              ? 'text-green-700 bg-green-50'
                              : 'text-gray-400 bg-gray-50'
                          )}
                        >
                          {item.checklist.hasTagline ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          Tagline
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded',
                            item.checklist.hasDescription
                              ? 'text-green-700 bg-green-50'
                              : 'text-gray-400 bg-gray-50'
                          )}
                        >
                          {item.checklist.hasDescription ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          Description
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded',
                            item.checklist.hasWebsite
                              ? 'text-green-700 bg-green-50'
                              : 'text-gray-400 bg-gray-50'
                          )}
                        >
                          {item.checklist.hasWebsite ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
                          Website
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded',
                            item.checklist.hasRevenue
                              ? 'text-green-700 bg-green-50'
                              : 'text-gray-400 bg-gray-50'
                          )}
                        >
                          {item.checklist.hasRevenue ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <DollarSign className="h-3 w-3" />
                          )}
                          Revenue
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded',
                            item.checklist.isVerified
                              ? 'text-green-700 bg-green-50'
                              : 'text-gray-400 bg-gray-50'
                          )}
                        >
                          {item.checklist.isVerified ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <BadgeCheck className="h-3 w-3" />
                          )}
                          Verified
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.startupsChecklist.some((s) => !s.checklist.isVerified) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground text-center">
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        Verified listings get 20% more visibility
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
