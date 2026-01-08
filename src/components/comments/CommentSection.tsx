'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronUp, MessageSquare, Share2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Comment } from '@/types';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface CommentItemProps {
  comment: Comment;
  isMaker?: boolean;
  isReply?: boolean;
  onReply?: (parentId: string) => void;
}

function CommentItem({ comment, isMaker = false, isReply = false, onReply }: CommentItemProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(comment.upvotes);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleUpvote = () => {
    if (upvoted) {
      setUpvoteCount((prev) => prev - 1);
    } else {
      setUpvoteCount((prev) => prev + 1);
    }
    setUpvoted(!upvoted);
  };

  const handleReply = () => {
    if (replyText.trim()) {
      // In real app, submit to API
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className={cn('space-y-3', isReply && 'ml-10 border-l-2 border-muted pl-4')}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.avatar} />
          <AvatarFallback>
            {comment.user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">@{comment.user.username}</span>
            {isMaker && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                MAKER
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 gap-1',
                upvoted && 'text-orange-500'
              )}
              onClick={handleUpvote}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="text-xs">{upvoteCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Reply</span>
            </Button>

            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="flex gap-2 mt-2">
              <Textarea
                placeholder={`Reply to @${comment.user.username}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isMaker={reply.user.badges.some((b) => b.type === 'maker')}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentSectionProps {
  comments: Comment[];
  makerId?: string;
  startupId: string;
  startupSlug?: string;
}

export function CommentSection({ comments, makerId, startupId, startupSlug }: CommentSectionProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(comments);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            avatar: data.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
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

  const currentUserAvatar = session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.id || 'guest'}`;
  const currentUserInitials = (session?.user?.name || 'You').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentUserAvatar} />
          <AvatarFallback>{currentUserInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={session ? "Write a comment..." : "Sign in to comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={!session || isSubmitting}
          />
          <div className="flex justify-end">
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

      {/* Comments List */}
      <div className="space-y-6">
        {localComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isMaker={comment.userId === makerId}
          />
        ))}
      </div>

      {localComments.length > 5 && (
        <div className="text-center">
          <Button variant="outline">Load more comments</Button>
        </div>
      )}
    </div>
  );
}
