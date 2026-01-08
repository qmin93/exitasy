'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronUp,
  MessageSquare,
  Share2,
  ExternalLink,
  CheckCircle,
  Eye,
  Globe,
  Loader2,
  Calendar,
  Rocket,
  TrendingUp,
  Award,
  AlertCircle,
  ArrowLeft,
  Flame,
  Quote,
  Sparkles,
  Users,
  Target,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { GuessGame } from '@/components/guess/GuessGame';
import { CommentSection } from '@/components/comments/CommentSection';
import { ActionRow } from '@/components/startup/ActionRow';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Comment } from '@/types';

// Transform API comment to Comment type
interface APIComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  replies?: APIComment[];
}

function transformComment(apiComment: APIComment, startupId: string): Comment {
  return {
    id: apiComment.id,
    userId: apiComment.user.id,
    user: {
      id: apiComment.user.id,
      username: apiComment.user.username || 'anonymous',
      email: '',
      avatar: apiComment.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiComment.user.id}`,
      bio: '',
      badges: [],
      guessAccuracy: 0,
      guessRank: 0,
      totalMRR: 0,
      createdAt: new Date(),
    },
    startupId,
    content: apiComment.content,
    upvotes: 0,
    replies: apiComment.replies?.map((reply) => transformComment(reply, startupId)),
    createdAt: new Date(apiComment.createdAt),
  };
}

// Stage config mapping
const STAGE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  MAKING_MONEY: { label: 'Making Money', emoji: '🟢', color: 'bg-green-500' },
  EXIT_READY: { label: 'Exit-Ready', emoji: '🟡', color: 'bg-yellow-500' },
  ACQUISITION_INTEREST: { label: 'Acquisition Interest', emoji: '🟠', color: 'bg-orange-500' },
  FOR_SALE: { label: 'For Sale', emoji: '🔵', color: 'bg-blue-500' },
  SOLD: { label: 'Sold', emoji: '🟣', color: 'bg-purple-500' },
};

interface StartupData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string | null;
  website: string;
  screenshots: string[];
  categories: string[];
  verificationStatus: string;
  verificationProvider: string | null;
  lastVerifiedAt: string | null;
  currentMRR: number;
  growthMoM: number;
  revenueAge: number;
  stage: string;
  askingPrice: number | null;
  saleMultiple: number | null;
  saleIncludes: string[];
  saleReason: string | null;
  founderNote: string | null;
  targetUsers: string | null;
  monetizationModel: string | null;
  sellabilityReasons: string[];
  upvoteCount: number;
  commentCount: number;
  guessCount: number;
  buyerInterestCount: number;
  todayRank: number | null;
  createdAt: string;
  launchDate: string | null;
  makers: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
      bio: string | null;
      twitter: string | null;
    };
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    replies: {
      id: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }[];
  }[];
  _count: {
    comments: number;
    guesses: number;
    upvotes: number;
    buyerInterests: number;
  };
}

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

export default function StartupDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();

  const [startup, setStartup] = useState<StartupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [interested, setInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [isUpvoting, setIsUpvoting] = useState(false);

  useEffect(() => {
    async function fetchStartup() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/startups/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Startup not found');
          } else {
            throw new Error('Failed to fetch startup');
          }
          return;
        }
        const data = await res.json();
        setStartup(data);
        setUpvoteCount(data.upvoteCount || 0);
        setInterestCount(data.buyerInterestCount || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchStartup();
    }
  }, [slug]);

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

  // Error state
  if (error || !startup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {error === 'Startup not found' ? 'Startup Not Found' : 'Oops!'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {error === 'Startup not found'
                  ? "This startup doesn't exist or may have been removed."
                  : 'Something went wrong while loading this startup.'}
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link href="/submit">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Rocket className="h-4 w-4 mr-2" />
                    Launch Your Startup
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[startup.stage] || STAGE_CONFIG.MAKING_MONEY;
  const isForSale = startup.stage === 'FOR_SALE' || startup.stage === 'EXIT_READY';

  const handleUpvote = async () => {
    if (!session) {
      alert('Please sign in to upvote');
      return;
    }
    if (isUpvoting) return;

    setIsUpvoting(true);
    try {
      const res = await fetch(`/api/startups/${slug}/upvote`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setUpvoted(data.upvoted);
        setUpvoteCount(data.upvoteCount);
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleInterest = async () => {
    if (!session) {
      alert('Please sign in to express interest');
      return;
    }
    if (interested) return;

    try {
      const res = await fetch(`/api/startups/${slug}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAnonymous: true }),
      });
      if (res.ok) {
        setInterested(true);
        setInterestCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to express interest:', err);
    }
  };

  // Get comments from startup data and transform to Comment type
  const transformedComments: Comment[] = (startup.comments || []).map((c) =>
    transformComment(c as APIComment, startup.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* ============================================ */}
            {/* HERO SECTION - Trophy Page Identity          */}
            {/* ============================================ */}
            <Card className={cn(
              "overflow-hidden",
              isForSale && "border-green-200 bg-gradient-to-r from-green-50/50 to-white",
              !isForSale && startup.todayRank && startup.todayRank <= 5 && "border-orange-200 bg-gradient-to-r from-orange-50/50 to-white"
            )}>
              <CardContent className="p-6">
                {/* Top Row: Logo + Info + Ranking */}
                <div className="flex gap-6">
                  {/* Logo - Larger with ring */}
                  <div className="relative">
                    <Avatar className={cn(
                      "h-24 w-24 rounded-xl ring-4 ring-offset-2",
                      startup.verificationStatus === 'VERIFIED' ? "ring-green-200" : "ring-gray-100"
                    )}>
                      <AvatarImage src={startup.logo || undefined} alt={startup.name} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 text-white text-3xl font-bold">
                        {startup.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {startup.verificationStatus === 'VERIFIED' && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">{startup.name}</h1>
                        <p className="text-lg text-muted-foreground mt-1">
                          {startup.tagline}
                        </p>
                      </div>

                      {/* Ranking Badge - More prominent */}
                      {startup.todayRank && (
                        <div className={cn(
                          "text-center rounded-xl px-5 py-3 shadow-sm",
                          startup.todayRank <= 3
                            ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                            : "bg-orange-100 text-orange-700"
                        )}>
                          <div className="text-3xl font-bold">
                            #{startup.todayRank}
                          </div>
                          <div className={cn(
                            "text-xs font-semibold",
                            startup.todayRank <= 3 ? "text-yellow-100" : "text-orange-600"
                          )}>
                            {startup.todayRank === 1 ? '🏆 TODAY' : 'TODAY'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      {startup.verificationStatus === 'VERIFIED' && (
                        <Badge className="bg-green-500 text-white hover:bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Revenue
                        </Badge>
                      )}
                      <Badge className={cn('text-white', stageConfig.color)}>
                        {stageConfig.emoji} {stageConfig.label}
                      </Badge>
                      {isForSale && startup.askingPrice && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                          💰 FOR SALE · ${(startup.askingPrice / 1000).toFixed(0)}K
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Engagement Stats Bar - Quick glance */}
                <div className="flex items-center gap-6 mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <ChevronUp className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{upvoteCount}</div>
                      <div className="text-xs text-muted-foreground">Upvotes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{transformedComments.length}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{startup._count.guesses}</div>
                      <div className="text-xs text-muted-foreground">Guesses</div>
                    </div>
                  </div>
                  {isForSale && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <Eye className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold">{interestCount}</div>
                        <div className="text-xs text-muted-foreground">Interested</div>
                      </div>
                    </div>
                  )}
                  {/* Categories */}
                  <div className="ml-auto flex items-center gap-2">
                    {startup.categories.slice(0, 3).map((cat) => (
                      <Link key={cat} href={`/category/${cat.toLowerCase()}`}>
                        <Badge variant="outline" className="hover:bg-muted cursor-pointer">
                          #{cat}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Row - Top */}
            <ActionRow
              startupName={startup.name}
              website={startup.website}
              upvoteCount={upvoteCount}
              commentCount={transformedComments.length}
              isUpvoted={upvoted}
              onUpvote={handleUpvote}
            />

            {/* Key Metrics - Quick glance */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div className="text-2xl font-bold text-green-700">
                      {formatMRR(startup.currentMRR)}
                    </div>
                    <div className="text-xs text-green-600 font-medium">MRR</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                    <div className="text-2xl font-bold text-blue-700">
                      +{startup.growthMoM}%
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Growth</div>
                  </div>
                  {isForSale && startup.askingPrice && (
                    <>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-purple-700">
                          ${(startup.askingPrice / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-purple-600 font-medium">Asking</div>
                      </div>
                      {startup.saleMultiple && (
                        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                          <div className="text-2xl font-bold text-orange-700">
                            {startup.saleMultiple}x
                          </div>
                          <div className="text-xs text-orange-600 font-medium">Multiple</div>
                        </div>
                      )}
                    </>
                  )}
                  {!isForSale && (
                    <>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                        <div className="text-2xl font-bold text-purple-700">
                          {startup.revenueAge}
                        </div>
                        <div className="text-xs text-purple-600 font-medium">Months</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                        <div className="text-2xl font-bold text-orange-700">
                          {startup._count.guesses}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">Guesses</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ============================================ */}
            {/* FOUNDER NOTE - The Story Asset ⭐           */}
            {/* Critical: This is a trust/emotional anchor */}
            {/* ============================================ */}
            {(startup.founderNote || startup.saleReason) && (
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Quote Icon with glow */}
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg shadow-orange-200">
                      <Quote className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      {/* Header with Story badge */}
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          {isForSale ? "💭 Why I'm Selling" : "💭 Founder's Note"}
                        </h3>
                        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Story
                        </Badge>
                      </div>
                      {/* Story Content - larger text */}
                      <blockquote className="text-gray-700 leading-relaxed text-base italic border-l-4 border-orange-300 pl-4">
                        "{startup.founderNote || startup.saleReason}"
                      </blockquote>
                      {/* Founder Attribution */}
                      {startup.makers[0] && (
                        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-orange-100">
                          <Avatar className="h-10 w-10 ring-2 ring-orange-200">
                            <AvatarImage src={startup.makers[0].user.image || undefined} />
                            <AvatarFallback className="bg-orange-100 text-orange-700">
                              {(startup.makers[0].user.username || 'F').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">
                              @{startup.makers[0].user.username}
                            </div>
                            <div className="text-xs text-orange-600 font-medium flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              Founder & Maker
                            </div>
                          </div>
                          <Link href={`/user/${startup.makers[0].user.username}`} className="ml-auto">
                            <Button variant="outline" size="sm" className="text-xs border-orange-200 hover:bg-orange-50">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Story - What, Who, How */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-blue-500" />
                  Product Story
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* What it does */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    What it does
                  </h4>
                  <p className="text-sm">{startup.description}</p>
                </div>

                {/* Target users */}
                {startup.targetUsers && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Target Users
                    </h4>
                    <p className="text-sm">{startup.targetUsers}</p>
                  </div>
                )}

                {/* Monetization */}
                {startup.monetizationModel && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Monetization
                    </h4>
                    <p className="text-sm">{startup.monetizationModel}</p>
                  </div>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {startup.categories.map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      #{cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="details">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                {startup.sellabilityReasons.length > 0 && (
                  <TabsTrigger value="sellability">Why Sellable</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                {/* Screenshots */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {startup.screenshots && startup.screenshots.length > 0 ? (
                      <>
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={startup.screenshots[0]}
                            alt={`${startup.name} screenshot`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {startup.screenshots.length > 1 && (
                          <div className="flex gap-2 mt-4">
                            {startup.screenshots.slice(0, 4).map((url, i) => (
                              <div
                                key={i}
                                className="w-20 h-14 rounded cursor-pointer hover:ring-2 ring-orange-500 overflow-hidden bg-gray-100"
                              >
                                <img
                                  src={url}
                                  alt={`Screenshot ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center">
                          <Globe className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-muted-foreground text-sm">
                            No screenshots yet
                          </span>
                        </div>
                        <a
                          href={startup.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button variant="outline" className="w-full gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Visit {startup.name}
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{startup.description}</p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {startup.categories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          #{cat}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="revenue" className="space-y-6">
                {/* Revenue Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Revenue Stats
                      {startup.verificationStatus === 'VERIFIED' && startup.verificationProvider && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-green-50 text-green-700"
                        >
                          Verified via {startup.verificationProvider}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">
                          {formatMRR(startup.currentMRR)}
                        </div>
                        <div className="text-sm text-muted-foreground">MRR</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          +{startup.growthMoM}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Growth MoM
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">
                          {startup.revenueAge} mo
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Revenue Age
                        </div>
                      </div>
                    </div>

                    {startup.lastVerifiedAt && (
                      <p className="text-xs text-muted-foreground mt-4 text-center">
                        Last verified:{' '}
                        {formatDistanceToNow(new Date(startup.lastVerifiedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* For Sale Details */}
                {isForSale && startup.askingPrice && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">For Sale Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            ${(startup.askingPrice / 1000).toFixed(0)}K
                          </div>
                          <div className="text-sm text-blue-600">
                            Asking Price
                          </div>
                        </div>
                        {startup.saleMultiple && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">
                              {startup.saleMultiple}x
                            </div>
                            <div className="text-sm text-blue-600">Multiple</div>
                          </div>
                        )}
                      </div>

                      {startup.saleIncludes && startup.saleIncludes.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Includes:</h4>
                          <div className="flex flex-wrap gap-2">
                            {startup.saleIncludes.map((item) => (
                              <Badge key={item} variant="outline">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {startup.saleReason && (
                        <div>
                          <h4 className="font-medium mb-2">Why selling:</h4>
                          <p className="text-muted-foreground">
                            {startup.saleReason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>{interestCount} people interested</span>
                        </div>
                        <Button
                          onClick={handleInterest}
                          disabled={interested}
                          className={cn(
                            interested
                              ? 'bg-green-500'
                              : 'bg-blue-500 hover:bg-blue-600'
                          )}
                        >
                          {interested ? "You're Interested" : "I'm Interested"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {startup.sellabilityReasons.length > 0 && (
                <TabsContent value="sellability">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Why This Is Sellable</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {startup.sellabilityReasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {/* ============================================ */}
            {/* COMMUNITY SECTION - Discussion Hub          */}
            {/* Founder comments are pinned at top          */}
            {/* ============================================ */}
            <Card id="discussion-section" className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    Community
                    <Badge className="bg-blue-100 text-blue-700">{transformedComments.length}</Badge>
                  </CardTitle>
                  {/* Role Legend */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Founder
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Top Guesser
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Buyer
                    </span>
                  </div>
                </div>
                {/* Founder active indicator */}
                {startup.makers[0] && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-orange-50 rounded-lg border border-orange-100">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={startup.makers[0].user.image || undefined} />
                      <AvatarFallback className="text-xs bg-orange-200 text-orange-700">
                        {(startup.makers[0].user.username || 'F').slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-orange-700">
                      <span className="font-medium">@{startup.makers[0].user.username}</span> is the founder. Their comments are pinned.
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <CommentSection
                  comments={transformedComments}
                  makerId={startup.makers[0]?.user?.id}
                  startupId={startup.id}
                  startupSlug={startup.slug}
                />
              </CardContent>
            </Card>

            {/* Action Row - Bottom */}
            <ActionRow
              startupName={startup.name}
              website={startup.website}
              upvoteCount={upvoteCount}
              commentCount={transformedComments.length}
              isUpvoted={upvoted}
              onUpvote={handleUpvote}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upvote Card */}
            <Card>
              <CardContent className="p-6 text-center">
                <Button
                  size="lg"
                  className={cn(
                    'w-full h-16 text-lg gap-2',
                    upvoted
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-gray-900 hover:bg-gray-800'
                  )}
                  onClick={handleUpvote}
                >
                  <ChevronUp className="h-6 w-6" />
                  UPVOTE ({upvoteCount})
                </Button>
              </CardContent>
            </Card>

            {/* Guess Game */}
            <GuessGame
              startupName={startup.name}
              startupSlug={startup.slug}
              actualMRR={startup.currentMRR}
              totalGuesses={startup.guessCount}
            />

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href={startup.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-orange-500"
                >
                  <Globe className="h-4 w-4" />
                  {startup.website.replace('https://', '')}
                  <ExternalLink className="h-3 w-3" />
                </a>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Makers</h4>
                  {startup.makers.map((maker) => (
                    <Link
                      key={maker.id}
                      href={`/user/${maker.user.username}`}
                      className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={maker.user.image || undefined} />
                        <AvatarFallback>
                          {(maker.user.username || maker.user.name || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">@{maker.user.username || 'unknown'}</div>
                        <div className="text-xs text-muted-foreground">
                          {maker.role || 'Maker'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {startup.categories.map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        #{cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
                  {/* Launch Event */}
                  <div className="relative">
                    <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-orange-500 border-2 border-white" />
                    <div className="text-sm">
                      <div className="font-medium flex items-center gap-1">
                        <Rocket className="h-3 w-3 text-orange-500" />
                        Launched on Exitasy
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(startup.launchDate || startup.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Verification Event */}
                  {startup.verificationStatus === 'VERIFIED' && startup.lastVerifiedAt && (
                    <div className="relative">
                      <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Revenue Verified
                          {startup.verificationProvider && (
                            <Badge variant="outline" className="text-[10px] ml-1">
                              via {startup.verificationProvider}
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(startup.lastVerifiedAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MRR Milestone */}
                  {startup.currentMRR >= 1000 && (
                    <div className="relative">
                      <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-blue-500" />
                          Reached {formatMRR(startup.currentMRR)} MRR
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {startup.revenueAge} months of revenue
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Today Rank */}
                  {startup.todayRank && startup.todayRank <= 10 && (
                    <div className="relative">
                      <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-yellow-500 border-2 border-white" />
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          Ranked #{startup.todayRank} Today
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Featured product
                        </div>
                      </div>
                    </div>
                  )}

                  {/* For Sale */}
                  {isForSale && (
                    <div className="relative">
                      <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-1">
                          <Eye className="h-3 w-3 text-purple-500" />
                          Listed for Sale
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {startup.askingPrice
                            ? `$${(startup.askingPrice / 1000).toFixed(0)}K asking`
                            : 'Contact for price'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Share Trophy */}
            <Card>
              <CardContent className="p-4">
                <Button variant="outline" className="w-full gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Trophy Card
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sticky Mobile Action Row */}
        <ActionRow
          startupName={startup.name}
          website={startup.website}
          upvoteCount={upvoteCount}
          commentCount={transformedComments.length}
          isUpvoted={upvoted}
          onUpvote={handleUpvote}
          variant="sticky"
        />
      </main>
    </div>
  );
}
