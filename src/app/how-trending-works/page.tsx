'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, TrendingUp, MessageSquare, Gamepad2, CheckCircle, DollarSign, Clock, Shield, UserPlus, Camera } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Score factor definitions - v5.0 Snapshot-Based with Daily Cron
const SCORE_FACTORS = [
  {
    id: 'upvotes',
    icon: TrendingUp,
    label: 'Upvotes',
    weight: '× 2',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    description: 'Basic engagement signal — shows the product caught someone\'s attention.',
  },
  {
    id: 'comments',
    icon: MessageSquare,
    label: 'Comments',
    weight: '× 3',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    description: 'Community participation signals genuine engagement and discussion.',
  },
  {
    id: 'guesses',
    icon: Gamepad2,
    label: 'Guess Participation',
    weight: '× 6',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    description: 'Revenue guessing shows deep market curiosity about the business.',
  },
  {
    id: 'request-intro',
    icon: UserPlus,
    label: 'Request Intro',
    weight: '× 12',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Strong acquisition intent — the highest weighted signal. Only verified buyers can request.',
  },
  {
    id: 'intro-accepted',
    icon: CheckCircle,
    label: 'Intro Accepted',
    weight: '+ 8 bonus',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    description: 'Founder accepted buyer intro — additional bonus for active deal progress.',
  },
  {
    id: 'verified',
    icon: CheckCircle,
    label: 'Verified Revenue',
    weight: '× 1.15',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    description: 'Trust multiplier for Stripe-connected verified revenue.',
  },
  {
    id: 'forsale',
    icon: DollarSign,
    label: 'For Sale Status',
    weight: '× 1.1',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    description: 'Listings actively for sale get a visibility boost.',
  },
  {
    id: 'recency',
    icon: Clock,
    label: 'Recency Decay',
    weight: '36h half-life',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    description: 'Recent activity counts more. Older spikes fade faster with 36-hour half-life.',
  },
  {
    id: 'snapshot',
    icon: Camera,
    label: 'Daily Snapshot',
    weight: 'Cron 00:00 UTC',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    description: 'Scores are recalculated daily and stored in TrendingSnapshot for consistent ranking.',
  },
];

const ANTI_SPAM_MEASURES = [
  {
    title: 'Verified Buyers Only',
    description: 'Only approved buyers can request intros — the highest-impact signal requires verification.',
  },
  {
    title: 'Same User Actions',
    description: 'Multiple actions from the same user don\'t stack — only unique signals count.',
  },
  {
    title: 'New Account Penalty',
    description: 'Accounts less than 24 hours old have 50% reduced impact.',
  },
  {
    title: 'Daily Snapshot Stability',
    description: 'Scores update once daily, preventing real-time manipulation attempts.',
  },
];

export default function HowTrendingWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Snapshot-Based v5.0
          </div>
          <h1 className="text-4xl font-bold mb-4">How Trending Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trending highlights listings with <strong>real buyer intent signals</strong> — stored in daily snapshots for stable, manipulation-resistant ranking.
          </p>
        </div>

        {/* Score Formula Overview */}
        <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              The Trending Formula v5.0 (Snapshot-Based)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-900 rounded-lg text-green-400 font-mono text-sm overflow-x-auto">
              <pre>{`TrendScore = log(1 + BaseScore) × 100 × RecencyDecay × TrustMult

BaseScore = Σ (EventWeight × TimeDecay)  // From EventLog table

EventLog Types & Weights (v5.0):
  UPVOTE                  × 2
  COMMENT                 × 3
  GUESS_SUBMIT            × 6
  INTRO_REQUEST_CREATED   × 12  // Verified buyers only!
  INTRO_REQUEST_ACCEPTED  + 8   // Bonus on top

TimeDecay = exp(-hours / 36)   // 36-hour half-life (faster decay)
TrustMult = VerifiedMult × StageMult
  // Verified: × 1.15
  // For Sale: × 1.1
  // Sold: × 0.2

// Scores stored in TrendingSnapshot, updated daily at 00:00 UTC`}</pre>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Scores recalculated <strong>daily via Vercel Cron</strong> and stored in <code className="bg-gray-100 px-1 rounded">TrendingSnapshot</code> table.
            </p>
          </CardContent>
        </Card>

        {/* Score Factors Grid */}
        <h2 className="text-2xl font-bold mb-6">What We Measure</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {SCORE_FACTORS.map((factor) => {
            const Icon = factor.icon;
            return (
              <Card key={factor.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${factor.bgColor}`}>
                      <Icon className={`h-5 w-5 ${factor.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{factor.label}</h3>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {factor.weight}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why This Design */}
        <Card className="mb-8 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle>Why This Design?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Exitasy is a revenue-first marketplace.</strong> Unlike traditional launch platforms that reward hype,
              we prioritize signals that indicate <strong>real acquisition intent</strong>.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Buyer intent matters most</strong> — Request Intro (× 12) is weighted highest because it represents real acquisition interest from verified buyers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Faster decay, fresher content</strong> — 36-hour half-life ensures trending reflects current momentum, not past glory.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Trust multipliers</strong> — Verified revenue listings get a 15% boost. For-sale products get 10% extra visibility.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Daily snapshots</strong> — Scores update once daily, preventing real-time gaming and ensuring stable rankings.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Sold products fade</strong> — Completed acquisitions drop to 20% score, making room for active opportunities.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Anti-Spam */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Anti-Manipulation Measures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {ANTI_SPAM_MEASURES.map((measure, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">{measure.title}</h4>
                  <p className="text-xs text-muted-foreground">{measure.description}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              New accounts (&lt;24h) have <strong>50% reduced impact</strong>. Only <strong>approved buyers</strong> can request intros.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Want to see your startup trending? Focus on building genuine engagement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/submit">
              <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                <Zap className="h-4 w-4" />
                Submit Your Startup
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Browse Trending
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
