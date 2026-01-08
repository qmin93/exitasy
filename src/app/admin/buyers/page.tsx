'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  Briefcase,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface BuyerApplication {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  buyerStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  applicationData: {
    companyName: string | null;
    budgetRange: string;
    timeline: string;
    buyerType: string;
    message: string;
    linkedinUrl: string | null;
    appliedAt: string;
  } | null;
}

const BUDGET_LABELS: Record<string, string> = {
  'under_10k': 'Under $10K',
  '10k_25k': '$10K - $25K',
  '25k_50k': '$25K - $50K',
  '50k_100k': '$50K - $100K',
  '100k_plus': '$100K+',
};

const TIMELINE_LABELS: Record<string, string> = {
  'asap': 'ASAP',
  '1_month': '1 month',
  '3_months': '3 months',
  'exploring': 'Exploring',
};

const BUYER_TYPE_LABELS: Record<string, string> = {
  'first_time': 'First-time',
  'serial': 'Serial Acquirer',
  'operator': 'Operator',
  'investor': 'Investor/Fund',
};

export default function AdminBuyersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [applications, setApplications] = useState<BuyerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Check if admin
  const user = session?.user as { role?: string } | undefined;
  const isAdmin = user?.role === 'ADMIN';

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/buyers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }

      setApplications(data.buyers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchApplications();
    }
  }, [status, isAdmin, fetchApplications]);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      setActionInProgress(userId);
      const response = await fetch('/api/admin/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process action');
      }

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === userId
            ? { ...app, buyerStatus: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : app
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionInProgress(null);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  // Not admin
  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
              <p className="text-muted-foreground mb-6">
                This page is restricted to administrators only.
              </p>
              <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const pendingApps = applications.filter((a) => a.buyerStatus === 'PENDING');
  const approvedApps = applications.filter((a) => a.buyerStatus === 'APPROVED');
  const rejectedApps = applications.filter((a) => a.buyerStatus === 'REJECTED');

  const filteredApps =
    activeTab === 'pending'
      ? pendingApps
      : activeTab === 'approved'
      ? approvedApps
      : rejectedApps;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Buyer Applications
            </h1>
            <p className="text-muted-foreground">
              Review and approve buyer applications
            </p>
          </div>
          <Button variant="outline" onClick={fetchApplications} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingApps.length}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{approvedApps.length}</div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{rejectedApps.length}</div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingApps.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved ({approvedApps.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({rejectedApps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredApps.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No {activeTab} applications</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'pending'
                      ? 'All caught up! No pending applications to review.'
                      : `No ${activeTab} applications yet.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onAction={handleAction}
                    isLoading={actionInProgress === app.id}
                    showActions={activeTab === 'pending'}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ApplicationCard({
  application,
  onAction,
  isLoading,
  showActions,
}: {
  application: BuyerApplication;
  onAction: (userId: string, action: 'approve' | 'reject') => void;
  isLoading: boolean;
  showActions: boolean;
}) {
  const appData = application.applicationData;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={application.image || undefined} />
              <AvatarFallback>
                {application.name?.charAt(0) || application.email?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{application.name || 'Anonymous'}</CardTitle>
              <CardDescription>{application.email}</CardDescription>
            </div>
          </div>
          <Badge
            variant={
              application.buyerStatus === 'APPROVED'
                ? 'default'
                : application.buyerStatus === 'REJECTED'
                ? 'destructive'
                : 'secondary'
            }
          >
            {application.buyerStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {appData ? (
          <div className="space-y-4">
            {/* Application Details */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {appData.companyName && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{appData.companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{BUDGET_LABELS[appData.budgetRange] || appData.budgetRange}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{TIMELINE_LABELS[appData.timeline] || appData.timeline}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{BUYER_TYPE_LABELS[appData.buyerType] || appData.buyerType}</span>
              </div>
            </div>

            {/* Message */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appData.message}</p>
            </div>

            {/* Links & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {appData.linkedinUrl && (
                  <a
                    href={appData.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
                <span className="text-xs text-muted-foreground">
                  Applied: {new Date(appData.appliedAt).toLocaleDateString()}
                </span>
              </div>

              {showActions && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction(application.id, 'reject')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => onAction(application.id, 'approve')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No application data available</p>
        )}
      </CardContent>
    </Card>
  );
}
