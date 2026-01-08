'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Filter,
  Linkedin,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface AccessRequest {
  id: string;
  status: string;
  message: string;
  budgetRange: string;
  timeline: string;
  buyerType: string;
  linkedinUrl: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string | null;
    bio: string | null;
    plan: string;
    totalGuesses: number;
    guessAccuracy: number;
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

const BUDGET_LABELS: Record<string, string> = {
  under_10k: 'Under $10K',
  '10k_25k': '$10K - $25K',
  '25k_50k': '$25K - $50K',
  '50k_100k': '$50K - $100K',
  '100k_plus': '$100K+',
  flexible: 'Flexible',
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: 'ASAP (within 2 weeks)',
  '1_month': 'Within 1 month',
  '3_months': 'Within 3 months',
  exploring: 'Just exploring',
};

const BUYER_TYPE_LABELS: Record<string, string> = {
  first_time: 'First-time buyer',
  serial: 'Serial acquirer',
  portfolio: 'Portfolio builder',
  operator: 'Operator looking to run it',
  strategic: 'Strategic buyer',
};

export default function RequestsManagementPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async (status?: string) => {
    try {
      const url = status && status !== 'all'
        ? `/api/founder/access-requests?status=${status.toUpperCase()}`
        : '/api/founder/access-requests';

      const res = await fetch(url);
      const data = await res.json();

      if (data.requests) {
        setRequests(data.requests);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRequests(activeTab === 'all' ? undefined : activeTab);
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, activeTab]);

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/founder/access-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewNote: reviewNote || null,
        }),
      });

      if (res.ok) {
        // Refresh the list
        await fetchRequests(activeTab === 'all' ? undefined : activeTab);
        setSelectedRequest(null);
        setReviewNote('');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to update request');
      }
    } catch (err) {
      console.error('Failed to review request:', err);
      alert('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Please sign in to manage intro requests.
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

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab.toUpperCase();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Link */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-green-500" />
            Intro Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage buyer intro requests for your startups.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {counts.pending > 0 && (
                <Badge className="bg-yellow-500 text-white ml-1">{counts.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
              <Badge variant="outline" className="ml-1">{counts.approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
              <Badge variant="outline" className="ml-1">{counts.rejected}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Request List */}
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className={cn(
                  'hover:shadow-md transition-shadow',
                  request.status === 'PENDING' && 'border-yellow-200 bg-yellow-50/30'
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.user.image || undefined} />
                        <AvatarFallback>
                          {(request.user.username || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            @{request.user.username || 'anonymous'}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              request.status === 'PENDING' && 'bg-yellow-100 text-yellow-700 border-yellow-300',
                              request.status === 'APPROVED' && 'bg-green-100 text-green-700 border-green-300',
                              request.status === 'REJECTED' && 'bg-red-100 text-red-700 border-red-300'
                            )}
                          >
                            {request.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                            {request.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {request.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                            {request.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <Link href={`/startup/${request.startup.slug}`} className="text-sm font-medium hover:text-orange-500">
                            {request.startup.name}
                          </Link>
                        </div>

                        {/* Message */}
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                          {request.message}
                        </p>

                        {/* Details */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {BUDGET_LABELS[request.budgetRange]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {TIMELINE_LABELS[request.timeline]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {BUYER_TYPE_LABELS[request.buyerType]}
                          </span>
                          {request.linkedinUrl && (
                            <a
                              href={request.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Linkedin className="h-3 w-3" />
                              LinkedIn
                            </a>
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          {request.reviewedAt && (
                            <span>
                              {' · '}
                              Reviewed {formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })}
                            </span>
                          )}
                        </p>

                        {/* Review Note */}
                        {request.reviewNote && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                            <span className="font-medium">Your note:</span> {request.reviewNote}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {request.status === 'PENDING' && (
                        <Button
                          onClick={() => setSelectedRequest(request)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No {activeTab} requests</h3>
                <p className="text-muted-foreground text-sm">
                  {activeTab === 'pending' && 'New intro requests will appear here.'}
                  {activeTab === 'approved' && 'Approved requests will appear here.'}
                  {activeTab === 'rejected' && 'Rejected requests will appear here.'}
                </p>
              </CardContent>
            </Card>
          )}
        </Tabs>
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Review Intro Request</DialogTitle>
                <DialogDescription>
                  From @{selectedRequest.user.username} for {selectedRequest.startup.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Buyer Info */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedRequest.user.image || undefined} />
                    <AvatarFallback>
                      {(selectedRequest.user.username || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">@{selectedRequest.user.username}</h4>
                    {selectedRequest.user.bio && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedRequest.user.bio}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{selectedRequest.user.totalGuesses} guesses</span>
                      <span>{(selectedRequest.user.guessAccuracy * 100).toFixed(0)}% accuracy</span>
                      {selectedRequest.linkedinUrl && (
                        <a
                          href={selectedRequest.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Linkedin className="h-3 w-3" />
                          View LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium mb-1">Message</h5>
                    <p className="text-sm text-muted-foreground p-3 bg-white border rounded">
                      {selectedRequest.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-green-600 font-medium">Budget</div>
                      <div className="font-semibold text-green-700">
                        {BUDGET_LABELS[selectedRequest.budgetRange]}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-600 font-medium">Timeline</div>
                      <div className="font-semibold text-blue-700">
                        {TIMELINE_LABELS[selectedRequest.timeline]}
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xs text-purple-600 font-medium">Buyer Type</div>
                      <div className="font-semibold text-purple-700 text-sm">
                        {BUYER_TYPE_LABELS[selectedRequest.buyerType]}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Note */}
                <div>
                  <label className="text-sm font-medium">Add a note (optional)</label>
                  <Textarea
                    placeholder="Add a note for the buyer (e.g., 'Happy to chat! Let's schedule a call.')"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleReview('REJECT')}
                  disabled={isSubmitting}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview('APPROVE')}
                  disabled={isSubmitting}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Access
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
