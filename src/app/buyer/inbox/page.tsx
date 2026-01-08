'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import {
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Handshake,
  MessageSquare,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface IntroRequest {
  id: string;
  status: 'NEW' | 'ACCEPTED' | 'DECLINED' | 'CONNECTED';
  message: string;
  companyName: string | null;
  budgetRange: string;
  timeline: string;
  buyerType: string;
  operatorPlan: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  connectedAt: string | null;
  startup: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    tagline: string | null;
    currentMRR: number;
    askingPrice: number | null;
    stage: string;
    makers: Array<{
      user: {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }>;
  };
}

const STATUS_CONFIG = {
  NEW: {
    label: 'Awaiting Review',
    icon: Clock,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    description: 'Your request is being reviewed by the founder.',
  },
  ACCEPTED: {
    label: 'Accepted',
    icon: CheckCircle,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    description: 'The founder has accepted your request! You can now access deal details.',
  },
  DECLINED: {
    label: 'Declined',
    icon: XCircle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    description: 'The founder declined your request at this time.',
  },
  CONNECTED: {
    label: 'Connected',
    icon: Handshake,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    description: 'You are connected with the founder. The deal is in progress!',
  },
};

export default function BuyerInboxPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<IntroRequest[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    NEW: 0,
    ACCEPTED: 0,
    DECLINED: 0,
    CONNECTED: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/buyer/inbox');
      const data = await res.json();

      if (data.requests) {
        setRequests(data.requests);
        setStatusCounts(data.statusCounts);
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInbox();
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
                Please sign in to view your intro requests.
              </p>
              <Link href="/login">
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
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6 text-blue-500" />
            My Intro Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Track the status of your intro requests to startup founders.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const count = statusCounts[key as keyof typeof statusCounts];
            return (
              <Card
                key={key}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  activeTab === key.toLowerCase() && 'ring-2 ring-orange-500'
                )}
                onClick={() => setActiveTab(activeTab === key.toLowerCase() ? 'all' : key.toLowerCase())}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn('p-2 rounded-lg', config.bgColor)}>
                      <Icon className={cn('h-4 w-4', config.textColor)} />
                    </div>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Clock className="h-3 w-3" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              <CheckCircle className="h-3 w-3" />
              Accepted
            </TabsTrigger>
            <TabsTrigger value="connected" className="gap-2">
              <Handshake className="h-3 w-3" />
              Connected
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Request List */}
        {filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Startup Logo */}
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {request.startup.logo ? (
                          <Image
                            src={request.startup.logo}
                            alt={request.startup.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                            {request.startup.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/startup/${request.startup.slug}`}
                            className="font-semibold hover:text-orange-500 flex items-center gap-1"
                          >
                            {request.startup.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              statusConfig.bgColor,
                              statusConfig.textColor,
                              statusConfig.borderColor
                            )}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {request.startup.tagline && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {request.startup.tagline}
                          </p>
                        )}

                        {/* Status Description */}
                        <p className="text-sm mt-2 text-muted-foreground">
                          {statusConfig.description}
                        </p>

                        {/* Founder Review Note */}
                        {request.reviewNote && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                              <MessageSquare className="h-4 w-4" />
                              Founder&apos;s Note
                            </div>
                            <p className="text-sm text-blue-800">{request.reviewNote}</p>
                          </div>
                        )}

                        {/* Startup Info */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                          {request.startup.currentMRR > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${request.startup.currentMRR.toLocaleString()}/mo MRR
                            </span>
                          )}
                          {request.startup.askingPrice && (
                            <span className="text-green-600 font-medium">
                              Asking ${request.startup.askingPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-muted-foreground mt-2">
                          <Send className="h-3 w-3 inline mr-1" />
                          Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          {request.reviewedAt && (
                            <span>
                              {' · '}
                              Reviewed {formatDistanceToNow(new Date(request.reviewedAt), { addSuffix: true })}
                            </span>
                          )}
                          {request.connectedAt && (
                            <span>
                              {' · '}
                              Connected {formatDistanceToNow(new Date(request.connectedAt), { addSuffix: true })}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        {request.status === 'ACCEPTED' && (
                          <Link href={`/startup/${request.startup.slug}?tab=deal`}>
                            <Button className="bg-green-500 hover:bg-green-600">
                              View Deal
                            </Button>
                          </Link>
                        )}
                        {request.status === 'CONNECTED' && (
                          <Link href={`/startup/${request.startup.slug}?tab=deal`}>
                            <Button className="bg-purple-500 hover:bg-purple-600">
                              <Handshake className="h-4 w-4 mr-2" />
                              Deal Room
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {activeTab === 'all' ? 'No intro requests yet' : `No ${activeTab} requests`}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {activeTab === 'all'
                  ? 'Start by browsing startups and requesting intros to founders.'
                  : `Your ${activeTab} requests will appear here.`}
              </p>
              {activeTab === 'all' && (
                <Link href="/for-sale">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Browse Startups for Sale
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
