'use client';

import Link from 'next/link';
import { Rocket, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-100 mb-8">
          <Rocket className="h-12 w-12 text-orange-500 rotate-45" />
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Houston, we have a problem
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for has either been moved or doesn't exist.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Link href="/">
            <Button className="gap-2 bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link
              href="/for-sale"
              className="text-orange-600 hover:text-orange-700 hover:underline"
            >
              Startups for Sale
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/leaderboard"
              className="text-orange-600 hover:text-orange-700 hover:underline"
            >
              Leaderboard
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/forum"
              className="text-orange-600 hover:text-orange-700 hover:underline"
            >
              Forum
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
