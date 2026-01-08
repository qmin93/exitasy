'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface VerifiedStartup {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  currentMRR: number;
  updatedAt: string;
}

export function JustVerifiedBanner() {
  const [startup, setStartup] = useState<VerifiedStartup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentlyVerified() {
      try {
        const res = await fetch('/api/startups?sort=latest&verifiedOnly=true&limit=1');
        if (res.ok) {
          const data = await res.json();
          if (data.startups && data.startups.length > 0) {
            // Only show if verified within 24 hours
            const startup = data.startups[0];
            const verifiedTime = new Date(startup.updatedAt);
            const now = new Date();
            const hoursDiff = (now.getTime() - verifiedTime.getTime()) / (1000 * 60 * 60);

            if (hoursDiff <= 24) {
              setStartup(startup);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching verified startup:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentlyVerified();
  }, []);

  if (isLoading || !startup) return null;

  return (
    <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white">
      <div className="container mx-auto max-w-6xl px-4 py-2">
        <Link
          href={`/startup/${startup.slug}`}
          className="flex items-center justify-center gap-3 text-sm hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="font-semibold">Just Verified</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Avatar className="h-5 w-5 border border-white/30">
              <AvatarImage src={startup.logo || undefined} alt={startup.name} />
              <AvatarFallback className="text-[10px] bg-white/20">
                {startup.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{startup.name}</span>
            <CheckCircle className="h-3.5 w-3.5" />
          </div>

          <span className="text-white/80">
            ${(startup.currentMRR / 1000).toFixed(startup.currentMRR >= 10000 ? 0 : 1)}K MRR
          </span>

          <span className="text-white/60 hidden sm:inline">
            · {formatDistanceToNow(new Date(startup.updatedAt), { addSuffix: true })}
          </span>

          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
