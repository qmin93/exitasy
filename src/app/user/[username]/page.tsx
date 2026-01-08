'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Globe,
  Twitter,
  MapPin,
  Calendar,
  Target,
  Trophy,
  TrendingUp,
  Settings,
  Loader2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { StartupCard } from '@/components/startup/StartupCard';
import { BadgeType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  location: string | null;
  guessAccuracy: number;
  guessRank: number;
  totalMRR: number;
  createdAt: string;
  badges: { type: string; earnedAt: string }[];
  startups: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    logo: string | null;
    currentMRR: number;
    verificationStatus: string;
    stage: string;
    upvoteCount: number;
  }[];
  _count: {
    guesses: number;
    comments: number;
    upvotes: number;
  };
}

const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  MAKER: { label: 'Maker', icon: '🛠️', color: 'bg-orange-100 text-orange-700' },
  VERIFIED_SELLER: { label: 'Verified Seller', icon: '✓', color: 'bg-green-100 text-green-700' },
  TOP_GUESSER: { label: 'Top Guesser', icon: '🎯', color: 'bg-purple-100 text-purple-700' },
  REVENUE_100K: { label: '$100K+ Revenue', icon: '💰', color: 'bg-yellow-100 text-yellow-700' },
  SOLD_STARTUP: { label: 'Sold Startup', icon: '🏆', color: 'bg-blue-100 text-blue-700' },
  EARLY_ADOPTER: { label: 'Early Adopter', icon: '⚡', color: 'bg-pink-100 text-pink-700' },
};

function formatMRR(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(mrr >= 10000 ? 0 : 1)}K`;
  }
  return `$${mrr}`;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = session?.user?.username === username;

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${username}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load user');
          }
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'User not found'}</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const productCount = user.startups.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Avatar */}
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-4xl">
                  {(user.username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                  <h1 className="text-2xl font-bold">@{user.username}</h1>
                  {isOwnProfile ? (
                    <Link href="/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
                  )}
                </div>

                {user.bio && (
                  <p className="text-muted-foreground mb-4">{user.bio}</p>
                )}

                {/* Links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Globe className="h-4 w-4" />
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {user.twitter && (
                    <a
                      href={`https://twitter.com/${user.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <Twitter className="h-4 w-4" />
                      {user.twitter.startsWith('@') ? user.twitter : `@${user.twitter}`}
                    </a>
                  )}
                  {user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined{' '}
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{productCount}</div>
                    <div className="text-xs text-muted-foreground">Products</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">
                      {formatMRR(user.totalMRR)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total MRR</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{user.guessAccuracy}%</div>
                    <div className="text-xs text-muted-foreground">Guess Acc</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">
                      {user.guessRank > 0 ? `#${user.guessRank}` : '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Guesser Rank</div>
                  </div>
                </div>

                {/* Badges */}
                {user.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    {user.badges.map((badge, index) => {
                      const config = BADGE_CONFIG[badge.type] || {
                        label: badge.type,
                        icon: '🏅',
                        color: 'bg-gray-100 text-gray-700',
                      };
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className={cn('text-sm', config.color)}
                        >
                          {config.icon} {config.label}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="products">
              Products ({productCount})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="guesses">Guesses ({user._count.guesses})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 mt-6">
            {user.startups.length > 0 ? (
              user.startups.map((startup) => (
                <Card key={startup.id}>
                  <CardContent className="p-4">
                    <Link href={`/startup/${startup.slug}`}>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={startup.logo || undefined} />
                          <AvatarFallback>
                            {startup.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{startup.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {startup.tagline}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatMRR(startup.currentMRR)}/mo
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {startup.verificationStatus === 'VERIFIED' ? '✓ Verified' : 'Unverified'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No products yet.</p>
                  {isOwnProfile && (
                    <Link href="/submit">
                      <Button className="mt-4">Submit Your Startup</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Activity feed coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guesses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Guess Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {user.guessAccuracy}%
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold">{user._count.guesses}</div>
                    <div className="text-sm text-muted-foreground">
                      Total Guesses
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold">
                      {user.guessRank > 0 ? `#${user.guessRank}` : '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Global Rank
                    </div>
                  </div>
                </div>

                <div className="text-center py-4 text-muted-foreground">
                  <p>Recent guesses coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
