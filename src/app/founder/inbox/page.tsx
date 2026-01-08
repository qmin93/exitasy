'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Eye,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface IntroRequest {
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
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
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

interface InboxData {
  requests: IntroRequest[];
  total: number;
  counts: {
    new: number;
    accepted: number;
    declined: number;
    connected: number;
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'NEW':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'ACCEPTED':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      );
    case 'DECLINED':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      );
    case 'CONNECTED':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Users className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function FounderInboxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status, router]);

  const fetchRequests = async (statusFilter?: string) => {
    try {
      const url = statusFilter && statusFilter !== 'all'
        ? `/api/founder/access-requests?status=${statusFilter}`
        : '/api/founder/access-requests';

      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLoading(true);
    const statusMap: Record<string, string | undefined> = {
      all: undefined,
      pending: 'NEW',
      accepted: 'ACCEPTED',
      declined: 'DECLINED',
    };
    fetchRequests(statusMap[value]);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </main>
      </div>
    );
  }

  const pendingCount = data?.counts.new || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Inbox className="h-8 w-8 text-orange-500" />
              Founder Inbox
            </h1>
            <p className="text-muted-foreground mt-1">
              Review intro requests from potential buyers
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {/* SLA Banner */}
        {pendingCount > 0 && (
          <Card className="mb-6 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-200 rounded-full animate-pulse">
                  <AlertCircle className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">
                    You have {pendingCount} pending intro request{pendingCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-yellow-700">
                    Avg response time target: <strong>24 hours</strong>. Respond quickly to keep buyers engaged!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1">
                {data?.total || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge variant="secondary" className="ml-1 bg-yellow-100">
                {data?.counts.new || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              Accepted
              <Badge variant="secondary" className="ml-1 bg-green-100">
                {data?.counts.accepted || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="declined" className="gap-2">
              Declined
              <Badge variant="secondary" className="ml-1 bg-red-100">
                {data?.counts.declined || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {!data?.requests.length ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">No requests yet</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending'
                      ? 'No pending intro requests to review'
                      : activeTab === 'accepted'
                      ? 'No accepted requests yet'
                      : activeTab === 'declined'
                      ? 'No declined requests'
                      : 'When buyers request intros, they\'ll appear here'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {data.requests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Buyer Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.user.image || undefined} />
                          <AvatarFallback>
                            {request.user.name?.[0] || request.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">
                                  {request.user.name || request.user.username || 'Anonymous Buyer'}
                                </h3>
                                {request.user.plan === 'buyer' && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Approved Buyer
                                  </Badge>
                                )}
                                {getStatusBadge(request.status)}
                              </div>
                              {request.companyName && (
                                <p className="text-sm text-muted-foreground">
                                  {request.companyName}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Request for startup */}
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Requesting intro for:</span>
                            <Link
                              href={`/startup/${request.startup.slug}`}
                              className="font-medium text-orange-600 hover:underline"
                            >
                              {request.startup.name}
                            </Link>
                          </div>

                          {/* Quick Stats */}
                          <div className="mt-3 flex flex-wrap gap-3">
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span>{budgetLabels[request.budgetRange] || request.budgetRange}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>{timelineLabels[request.timeline] || request.timeline}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="w-4 h-4 text-purple-500" />
                              <span>{buyerTypeLabels[request.buyerType] || request.buyerType}</span>
                            </div>
                          </div>

                          {/* Message Preview */}
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <MessageSquare className="w-3 h-3" />
                              Message
                            </div>
                            <p className="text-sm line-clamp-2">{request.message}</p>
                          </div>

                          {/* CTA */}
                          <div className="mt-4">
                            <Link href={`/founder/inbox/${request.id}`}>
                              <Button className="gap-2">
                                <Eye className="w-4 h-4" />
                                View Request
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
