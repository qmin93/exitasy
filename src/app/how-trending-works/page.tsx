'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, TrendingUp, MessageSquare, Gamepad2, CheckCircle, DollarSign, Clock, Shield, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Score factor definitions
const SCORE_FACTORS = [
  {
    id: 'upvotes',
    icon: TrendingUp,
    label: 'Upvotes',
    weight: '× 2',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    description: 'Community validation from users who find value in the product.',
  },
  {
    id: 'comments',
    icon: MessageSquare,
    label: 'Comments',
    weight: '× 3',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    description: 'Active discussion signals genuine interest and engagement.',
  },
  {
    id: 'guesses',
    icon: Gamepad2,
    label: 'Guess Participation',
    weight: '× 1',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    description: 'Revenue guessing shows market curiosity about the product.',
  },
  {
    id: 'buyer',
    icon: Users,
    label: 'Buyer Interest',
    weight: '× 8-14',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    description: 'Express Interest (× 8) and Request Intro (× 14) from potential buyers.',
  },
  {
    id: 'verified',
    icon: CheckCircle,
    label: 'Verified Revenue',
    weight: '+ 15%',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    description: 'Stripe-connected products get a trust bonus.',
  },
  {
    id: 'forsale',
    icon: DollarSign,
    label: 'For Sale Bonus',
    weight: '+ 10',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    description: 'Products listed for sale get visibility boost to attract buyers.',
  },
  {
    id: 'recency',
    icon: Clock,
    label: 'Time Decay',
    weight: '1.5× - 0.8×',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    description: 'Recent activity matters more. Events within 24h get 1.5× weight.',
  },
];

const ANTI_SPAM_MEASURES = [
  {
    title: 'Rate Limiting',
    description: 'Actions from the same user are rate-limited to prevent spam.',
  },
  {
    title: 'IP/Device Heuristics',
    description: 'Suspicious patterns from similar sources are detected.',
  },
  {
    title: 'Anomaly Detection',
    description: 'Unusual activity spikes trigger automatic review.',
  },
  {
    title: 'Verified-Only Boost',
    description: 'Only Stripe-verified products get the full trust bonus.',
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
            Transparency First
          </div>
          <h1 className="text-4xl font-bold mb-4">How Trending Works</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trending is based on <strong>community activity</strong> and <strong>real buyer interest</strong> — not just likes.
          </p>
        </div>

        {/* Score Formula Overview */}
        <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              The Trending Formula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-900 rounded-lg text-green-400 font-mono text-sm overflow-x-auto">
              <pre>{`TrendScore = (
  Upvotes × 2 +
  Comments × 3 +
  Guesses × 1 +
  BuyerInterest × 8 +
  IntroRequests × 14 +
  RecencyBonus +
  VerifiedBonus +
  ForSaleBonus
) × RecencyMultiplier`}</pre>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              All factors are calculated over a <strong>7-day rolling window</strong>.
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
              <strong>Exitasy is a revenue-first community.</strong> Unlike traditional launch platforms that reward hype,
              we prioritize signals that indicate genuine market demand.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Buyer actions matter more</strong> — Request Intro (× 14) is weighted highest because it's a serious signal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Verified products get a boost</strong> — Stripe-connected revenue proof builds trust.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Comments beat upvotes</strong> — Real discussion (× 3) is more valuable than passive likes (× 2).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span><strong>Recency rewards fresh activity</strong> — Recent engagement is weighted 1.5× more.</span>
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
              Suspicious activity results in a <strong>30% score penalty</strong> until reviewed.
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
