'use client';

import { useState } from 'react';
import { ChevronUp, MessageSquare, ExternalLink, Share2, Heart, Bookmark, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ActionRowProps {
  startupName: string;
  website: string;
  upvoteCount: number;
  commentCount: number;
  isUpvoted?: boolean;
  onUpvote?: () => void;
  onComment?: () => void;
  variant?: 'default' | 'compact' | 'sticky';
  className?: string;
}

export function ActionRow({
  startupName,
  website,
  upvoteCount,
  commentCount,
  isUpvoted = false,
  onUpvote,
  onComment,
  variant = 'default',
  className,
}: ActionRowProps) {
  const [upvoted, setUpvoted] = useState(isUpvoted);
  const [localUpvoteCount, setLocalUpvoteCount] = useState(upvoteCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  const handleUpvote = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (upvoted) {
      setLocalUpvoteCount((prev) => prev - 1);
    } else {
      setLocalUpvoteCount((prev) => prev + 1);
    }
    setUpvoted(!upvoted);
    onUpvote?.();
  };

  const handleComment = () => {
    // Scroll to comments section
    const commentsSection = document.getElementById('comments');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
    onComment?.();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: startupName,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleWatch = () => {
    setIsWatching(!isWatching);
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant={upvoted ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'gap-1.5 transition-all duration-200',
            upvoted && 'bg-orange-500 hover:bg-orange-600',
            isAnimating && 'scale-110'
          )}
          onClick={handleUpvote}
        >
          <ChevronUp className={cn('h-4 w-4', isAnimating && '-translate-y-0.5')} />
          <span className="font-semibold">{localUpvoteCount}</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleComment}>
          <MessageSquare className="h-4 w-4" />
          <span>{commentCount}</span>
        </Button>
        <a href={website} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-4 w-4" />
            Visit
          </Button>
        </a>
      </div>
    );
  }

  if (variant === 'sticky') {
    return (
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-50 lg:hidden',
          className
        )}
      >
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <Button
            variant={upvoted ? 'default' : 'outline'}
            className={cn(
              'flex-1 gap-2 h-12 transition-all duration-200',
              upvoted && 'bg-orange-500 hover:bg-orange-600',
              isAnimating && 'scale-105'
            )}
            onClick={handleUpvote}
          >
            <ChevronUp className={cn('h-5 w-5', isAnimating && '-translate-y-1')} />
            <span className="font-bold">{localUpvoteCount}</span>
          </Button>
          <Button variant="outline" className="flex-1 gap-2 h-12" onClick={handleComment}>
            <MessageSquare className="h-5 w-5" />
            <span>{commentCount}</span>
          </Button>
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full gap-2 h-12 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
              <ExternalLink className="h-5 w-5" />
              Visit
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // Default variant - full featured
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm',
        className
      )}
    >
      {/* Primary Actions */}
      <div className="flex items-center gap-3">
        {/* Upvote Button - Prominent */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={upvoted ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  'gap-2 min-w-[100px] h-12 transition-all duration-200',
                  upvoted && 'bg-orange-500 hover:bg-orange-600',
                  isAnimating && 'scale-105 shadow-lg'
                )}
                onClick={handleUpvote}
              >
                <ChevronUp
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    upvoted && 'animate-bounce',
                    isAnimating && '-translate-y-1'
                  )}
                />
                <span className="font-bold text-lg">{localUpvoteCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{upvoted ? 'Remove upvote' : 'Upvote this product'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Comment Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 h-12 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                onClick={handleComment}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">{commentCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Join the discussion</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Visit Site Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={website} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 h-12 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span className="font-semibold">Visit Site</span>
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open {startupName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center gap-2">
        {/* Follow Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 transition-all duration-200',
                  isFollowing && 'text-red-500 hover:text-red-600'
                )}
                onClick={handleFollow}
              >
                <Heart
                  className={cn('h-5 w-5', isFollowing && 'fill-red-500')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFollowing ? 'Unfollow' : 'Follow for updates'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Watch Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-10 w-10 transition-all duration-200',
                  isWatching && 'text-yellow-500 hover:text-yellow-600'
                )}
                onClick={handleWatch}
              >
                <Bell
                  className={cn('h-5 w-5', isWatching && 'fill-yellow-500')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isWatching ? 'Stop watching' : 'Watch this product'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Save Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Bookmark className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save to collection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Share Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
