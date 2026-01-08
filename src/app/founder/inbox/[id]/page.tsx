'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Target,
  Briefcase,
  Linkedin,
  Building,
  Loader2,
} from 'lucide-react';

interface IntroRequestDetail {
  id: string;
  companyName: string | null;
  message: string;
  budgetRange: string;
  timeline: string;
  buyerType: string;
  operatorPlan: string | null;
  linkedinUrl: string | null;
  status: 'NEW' | 'ACCEPTED' | 'DECLINED' | 'CONNECTED';
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
    bio: string | null;
    website: string | null;
    twitter: string | null;
    plan: string;
    totalGuesses: number;
    guessAccuracy: number;
    createdAt: string;
  };
  startup: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    currentMRR: number;
    askingPrice: number | null;
    stage: string;
  };
}

const budgetLabels: Record<string, string> = {
  under_10k: 'Under $10K',
  '10k_25k': '$10K - $25K',
  '25k_50k': '$25K - $50K',
  '50k_100k': '$50K - $100K',
  '100k_250k': '$100K - $250K',
  '100k_plus': '$100K+',
  '250k_plus': '$250K+',
};

const timelineLabels: Record<string, string> = {
  asap: 'ASAP',
  '1_month': '1 Month',
  '30_days': '30 Days',
  '30_60_days': '30-60 Days',
  '3_months': '3 Months',
  exploring: 'Exploring',
};

const buyerTypeLabels: Record<string, string> = {
  first_time: 'First-time Buyer',
  serial: 'Serial Acquirer',
  operator: 'Operator',
  investor: 'Investor',
};

const declineReasons = [
  { value: 'not_fit', label: 'Not a fit for this buyer' },
  { value: 'too_early', label: 'Too early to sell' },
  { value: 'price_mismatch', label: 'Budget/price mismatch' },
  { value: 'other', label: 'Other reason' },
];

export default function InboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [request, setRequest] = useState<IntroRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (sessionStatus === 'authenticated') {
      fetchRequest();
    }
  }, [sessionStatus, id, router]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/founder/access-requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
      } else if (res.status === 403) {
        router.push('/founder/inbox');
      } else if (res.status === 404) {
        router.push('/founder/inbox');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/founder/access-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          reviewNote: reviewNote || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowAcceptModal(false);
        // Redirect to deal room if created
        if (data.dealRoom?.id) {
          router.push(`/deal/${data.dealRoom.id}`);
        } else {
          fetchRequest();
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      const note = declineReason === 'other' ? reviewNote : declineReasons.find(r => r.value === declineReason)?.label;
      const res = await fetch(`/api/founder/access-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          reviewNote: note || reviewNote || null,
        }),
      });

      if (res.ok) {
        setShowDeclineModal(false);
        fetchRequest();
      }
    } catch (error) {
      console.error('Error declining request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl text-center">
          <h1 className="text-2xl font-bold">Request not found</h1>
          <Link href="/founder/inbox">
            <Button className="mt-4">Back to Inbox</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isPending = request.status === 'NEW';
  const isAccepted = request.status === 'ACCEPTED';
  const isDeclined = request.status === 'DECLINED';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link href="/founder/inbox">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Inbox
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {isPending && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="w-3 h-3 mr-1" />
                Pending Review
              </Badge>
            )}
            {isAccepted && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Accepted
              </Badge>
            )}
            {isDeclined && (
              <Badge className="bg-red-100 text-red-800">
                <XCircle className="w-3 h-3 mr-1" />
                Declined
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">
            Intro Request for {request.startup.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Submitted on {new Date(request.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Buyer Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Buyer Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={request.user.image || undefined} />
                    <AvatarFallback className="text-lg">
                      {request.user.name?.[0] || request.user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold">
                        {request.user.name || request.user.username || 'Anonymous Buyer'}
                      </h3>
                      {request.user.plan === 'buyer' && (
                        <Badge className="bg-green-100 text-green-700">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Verified Buyer
                        </Badge>
                      )}
                    </div>
                    {request.companyName && (
                      <p className="text-muted-foreground flex items-center gap-1 mt-1">
                        <Building className="w-4 h-4" />
                        {request.companyName}
                      </p>
                    )}
                    {request.user.bio && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {request.user.bio}
                      </p>
                    )}

                    {/* External Links */}
                    <div className="flex gap-3 mt-3">
                      {request.linkedinUrl && (
                        <a
                          href={request.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                      )}
                      {request.user.website && (
                        <a
                          href={request.user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Website
                        </a>
                      )}
                    </div>

                    {/* Member since */}
                    <p className="text-xs text-muted-foreground mt-3">
                      Member since {new Date(request.user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>

                {/* Buyer Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {buyerTypeLabels[request.buyerType] || request.buyerType}
                    </div>
                    <div className="text-xs text-muted-foreground">Buyer Type</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {request.user.totalGuesses}
                    </div>
                    <div className="text-xs text-muted-foreground">Guesses Made</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {request.user.guessAccuracy > 0 ? `${(request.user.guessAccuracy * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Guess Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Why They Want to Connect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{request.message}</p>
                </div>
              </CardContent>
            </Card>

            {/* Operator Plan (if provided) */}
            {request.operatorPlan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-500" />
                    Operator Plan
                  </CardTitle>
                  <CardDescription>
                    How they plan to operate the business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{request.operatorPlan}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Note (if reviewed) */}
            {request.reviewNote && (
              <Card className={isAccepted ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isAccepted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Your Review Note
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{request.reviewNote}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Reviewed on {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Budget
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {budgetLabels[request.budgetRange] || request.budgetRange}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Timeline
                  </span>
                  <Badge variant="secondary">
                    {timelineLabels[request.timeline] || request.timeline}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    For
                  </span>
                  <Link
                    href={`/startup/${request.startup.slug}`}
                    className="font-medium text-orange-600 hover:underline"
                  >
                    {request.startup.name}
                  </Link>
                </div>
                {request.startup.askingPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Asking Price</span>
                    <span className="font-semibold">
                      ${request.startup.askingPrice.toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {isPending && (
              <Card className="border-2 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Your Response
                  </CardTitle>
                  <CardDescription>
                    Review this request and decide whether to connect
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setShowAcceptModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept Intro
                  </Button>
                  <Button
                    onClick={() => setShowDeclineModal(true)}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Decline
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Accepting opens a private deal room for communication
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Already Reviewed */}
            {!isPending && (
              <Card className={isAccepted ? 'border-green-200' : 'border-red-200'}>
                <CardContent className="py-6 text-center">
                  {isAccepted ? (
                    <>
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-green-700">Request Accepted</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        A deal room has been opened for this buyer
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-red-700">Request Declined</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        The buyer has been notified
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Accept Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept this intro?</DialogTitle>
            <DialogDescription>
              We'll notify the buyer and open a private deal room. You can share contact details there.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="acceptNote">Add a note (optional)</Label>
              <Textarea
                id="acceptNote"
                placeholder="e.g., Looking forward to discussing this opportunity..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Accept & Open Deal Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Modal */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline this request?</DialogTitle>
            <DialogDescription>
              The buyer will be notified. You can still accept later if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason (optional)</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {declineReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {declineReason === 'other' && (
              <div>
                <Label htmlFor="declineNote">Additional note</Label>
                <Textarea
                  id="declineNote"
                  placeholder="Provide more context..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDecline}
              disabled={actionLoading}
              variant="destructive"
              className="gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
