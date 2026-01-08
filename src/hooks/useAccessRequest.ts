'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface AccessRequestStatus {
  hasRequested: boolean;
  requestId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  createdAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export function useAccessRequest(startupSlug: string) {
  const { data: session } = useSession();
  const [data, setData] = useState<AccessRequestStatus>({
    hasRequested: false,
    requestId: null,
    status: null,
    createdAt: null,
    reviewedAt: null,
    reviewNote: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!session?.user?.id || !startupSlug) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/startups/${startupSlug}/intro-request`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      setError('Failed to fetch access request status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, startupSlug]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const refetch = () => {
    setIsLoading(true);
    fetchStatus();
  };

  return {
    ...data,
    isLoading,
    error,
    refetch,
    // Helper properties
    isPending: data.status === 'PENDING',
    isApproved: data.status === 'APPROVED',
    isRejected: data.status === 'REJECTED',
    canRequest: !data.hasRequested,
    hasAccess: data.status === 'APPROVED',
  };
}
