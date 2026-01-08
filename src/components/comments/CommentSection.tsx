'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronUp, MessageSquare, Share2, Loader2, MoreHorizontal, Flag, Award, Target, ShoppingBag, Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Comment } from '@/types';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

// Badge types for comment authors
type AuthorBadgeType = 'founder' | 'buyer' | 'guesser' | 'top_guesser' | 'verified_buyer' | 'supporter';

interface AuthorBadge {
  type: AuthorBadgeType;
  label: string;
  icon: React.ReactNode;
  className: string;
}

const AUTHOR_BADGES: Record<AuthorBadgeType, AuthorBadge> = {
  founder: {
    type: 'founder',
    label: 'Founder',
    icon: <Award className="h-3 w-3" />,
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  buyer: {
    type: 'buyer',
    label: 'Buyer',
    icon: <ShoppingBag className="h-3 w-3" />,
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  guesser: {
    type: 'guesser',
    label: 'Guesser',
    icon: <Target className="h-3 w-3" />,
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  top_guesser: {
    type: 'top_guesser',
    label: 'Top Guesser',
    icon: <Target className="h-3 w-3" />,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  verified_buyer: {
    type: 'verified_buyer',
    label: 'Verified Buyer',
    icon: <ShoppingBag className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  supporter: {
    type: 'supporter',
    label: 'Supporter',
    icon: <Award className="h-3 w-3" />,
    className: 'bg-pink-100 text-pink-700 border-pink-200',
  },
};

interface CommentItemProps {
  comment: Comment;
  authorBadges?: AuthorBadgeType[];
  isReply?: boolean;
  isPinned?: boolean;
  onReply?: (parentId: string, content: string) => void;
  startupSlug?: string;
}

function CommentItem({ comment, authorBadges = [], isReply = false, isPinned = false, onReply, startupSlug }: CommentItemProps) {
  const { data: session } = useSession();
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(comment.upvotes);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleUpvote = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (upvoted) {
      setUpvoteCount((prev) => prev - 1);
    } else {
      setUpvoteCount((prev) => prev + 1);
    }
    setUpvoted(!upvoted);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !session) return;

    setIsSubmittingReply(true);
    try {
      // Call parent's onReply handler
      onReply?.(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.href}#comment-${comment.id}`);
    alert('Comment link copied!');
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={cn(
        'space-y-3 group',
        isReply && 'ml-10 border-l-2 border-gray-100 pl-4',
        isPinned && 'bg-gradient-to-r from-orange-50/50 to-transparent -mx-4 px-4 py-3 rounded-lg border-l-2 border-l-orange-400'
      )}
    >
      <div className="flex gap-3">
        <Avatar className={cn('h-8 w-8', !isReply && 'h-10 w-10', isPinned && 'ring-2 ring-orange-300')}>
          <AvatarImage src={comment.user.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white text-xs">
            {comment.user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm hover:text-orange-600 cursor-pointer">
                @{comment.user.username}
              </span>

              {/* Pinned Badge */}
              {isPinned && (
                <Badge variant="outline" className="text-[10px] gap-1 py-0 h-5 bg-orange-50 text-orange-600 border-orange-200">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}

              {/* Author Badges */}
              {authorBadges.map((badgeType) => {
                const badge = AUTHOR_BADGES[badgeType];
                if (!badge) return null;
                return (
                  <Badge
                    key={badgeType}
                    variant="outline"
                    className={cn('text-[10px] gap-1 py-0 h-5', badge.className)}
                  >
                    {badge.icon}
                    {badge.label}
                  </Badge>
                );
              })}

              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
            </div>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 gap-1 transition-all duration-200',
                upvoted && 'text-orange-500 bg-orange-50',
                isAnimating && 'scale-110'
              )}
              onClick={handleUpvote}
            >
              <ChevronUp
                className={cn(
                  'h-4 w-4 transition-transform',
                  isAnimating && '-translate-y-0.5'
                )}
              />
              <span className={cn('text-xs', upvoted && 'font-semibold')}>
                {upvoteCount > 0 ? upvoteCount : 'Like'}
              </span>
            </Button>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-2 gap-1',
                  showReplyInput && 'text-blue-500 bg-blue-50'
                )}
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Reply</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <Textarea
                placeholder={`Reply to @${comment.user.username}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm bg-white"
                disabled={isSubmittingReply}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyInput(false)}
                  disabled={isSubmittingReply}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmittingReply ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Reply'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              authorBadges={getAuthorBadges(reply, '')}
              isReply
              startupSlug={startupSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to determine author badges
function getAuthorBadges(comment: Comment, makerId?: string): AuthorBadgeType[] {
  const badges: AuthorBadgeType[] = [];

  // Check if user is the maker/founder
  if (makerId && comment.userId === makerId) {
    badges.push('founder');
  }

  // Check user badges from profile
  if (comment.user.badges) {
    comment.user.badges.forEach((badge) => {
      if (badge.type === 'maker') badges.push('founder');
      if (badge.type === 'verified_seller') badges.push('buyer');
      if (badge.type === 'top_guesser') badges.push('top_guesser');
    });
  }

  // Check if user has good guess accuracy (top guesser)
  if (comment.user.guessAccuracy >= 80) {
    badges.push('top_guesser');
  } else if (comment.user.guessAccuracy >= 50) {
    badges.push('guesser');
  }

  return [...new Set(badges)]; // Remove duplicates
}

interface CommentSectionProps {
  comments: Comment[];
  makerId?: string;
  buyerIds?: string[]; // Users who expressed interest
  guesserIds?: string[]; // Users who made guesses
  startupId: string;
  startupSlug?: string;
}

export function CommentSection({
  comments,
  makerId,
  buyerIds = [],
  guesserIds = [],
  startupId,
  startupSlug,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    if (!session) {
      alert('Please sign in to comment');
      return;
    }

    if (!startupSlug) {
      console.error('startupSlug is required for posting comments');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/startups/${startupSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        // Transform API response to Comment type
        const newCommentObj: Comment = {
          id: data.id,
          userId: data.user.id,
          user: {
            id: data.user.id,
            username: data.user.username || 'anonymous',
            email: '',
            avatar:
              data.user.image ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
            bio: '',
            badges: [],
            guessAccuracy: 0,
            guessRank: 0,
            totalMRR: 0,
            createdAt: new Date(),
          },
          startupId,
          content: data.content,
          upvotes: 0,
          createdAt: new Date(data.createdAt),
        };
        setLocalComments([newCommentObj, ...localComments]);
        setNewComment('');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (parentId: string, content: string) => {
    // In a real app, this would call the API
    console.log('Reply to', parentId, ':', content);
    // For now, just add locally
    const parentIndex = localComments.findIndex((c) => c.id === parentId);
    if (parentIndex !== -1 && session) {
      const newReply: Comment = {
        id: `reply-${Date.now()}`,
        userId: session.user?.id || 'unknown',
        user: {
          id: session.user?.id || 'unknown',
          username: session.user?.name || 'You',
          email: '',
          avatar:
            session.user?.image ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user?.id}`,
          bio: '',
          badges: [],
          guessAccuracy: 0,
          guessRank: 0,
          totalMRR: 0,
          createdAt: new Date(),
        },
        startupId,
        content,
        upvotes: 0,
        createdAt: new Date(),
      };

      const updatedComments = [...localComments];
      if (!updatedComments[parentIndex].replies) {
        updatedComments[parentIndex].replies = [];
      }
      updatedComments[parentIndex].replies!.push(newReply);
      setLocalComments(updatedComments);
    }
  };

  // Get author badges for a comment
  const getCommentBadges = (comment: Comment): AuthorBadgeType[] => {
    const badges: AuthorBadgeType[] = [];

    // Check if founder
    if (makerId && comment.userId === makerId) {
      badges.push('founder');
    }

    // Check if buyer (expressed interest)
    if (buyerIds.includes(comment.userId)) {
      badges.push('buyer');
    }

    // Check if guesser
    if (guesserIds.includes(comment.userId)) {
      badges.push('guesser');
    }

    // Check user's guess accuracy for top guesser badge
    if (comment.user.guessAccuracy >= 80) {
      badges.push('top_guesser');
    }

    return [...new Set(badges)];
  };

  // Check if a comment is from the founder
  const isFounderComment = (comment: Comment): boolean => {
    return Boolean(makerId && comment.userId === makerId);
  };

  // Sort comments with founder comments pinned at top
  const sortedComments = [...localComments].sort((a, b) => {
    // Founder comments always come first
    const aIsFounder = isFounderComment(a);
    const bIsFounder = isFounderComment(b);

    if (aIsFounder && !bIsFounder) return -1;
    if (!aIsFounder && bIsFounder) return 1;

    // Among non-founder comments, sort by selected criteria
    if (sortBy === 'popular') {
      return b.upvotes - a.upvotes;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const currentUserAvatar =
    session?.user?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.id || 'guest'}`;
  const currentUserInitials = (session?.user?.name || 'You')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div id="comments" className="space-y-6">
      {/* Comment Input */}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentUserAvatar} />
          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white">
            {currentUserInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={session ? 'Write a comment...' : 'Sign in to comment...'}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={!session || isSubmitting}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Be respectful and constructive
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting || !session}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Comment'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      {localComments.length > 1 && (
        <div className="flex items-center gap-2 border-b pb-3">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant={sortBy === 'newest' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSortBy('newest')}
          >
            Newest
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSortBy('popular')}
          >
            Popular
          </Button>
        </div>
      )}

      {/* Comments List */}
      {sortedComments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium mb-1">No comments yet</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              authorBadges={getCommentBadges(comment)}
              isPinned={isFounderComment(comment)}
              onReply={handleReply}
              startupSlug={startupSlug}
            />
          ))}
        </div>
      )}

      {localComments.length > 5 && (
        <div className="text-center">
          <Button variant="outline">Load more comments</Button>
        </div>
      )}
    </div>
  );
}
