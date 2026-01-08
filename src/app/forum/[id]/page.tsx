'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  ChevronUp,
  ArrowLeft,
  Pin,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ForumCategory, FORUM_CATEGORIES } from '@/types';

interface ForumReply {
  id: string;
  content: string;
  upvotes: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  category: ForumCategory;
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  replies: ForumReply[];
}

export default function ForumThreadPage() {
  const params = useParams();
  const router = useRouter();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchThread() {
      if (!params.id) return;

      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/forum/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Thread not found');
          } else {
            throw new Error('Failed to fetch thread');
          }
          return;
        }

        const data = await res.json();
        setThread(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchThread();
  }, [params.id]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    // TODO: Implement reply submission
    setTimeout(() => {
      setIsSubmitting(false);
      setReplyContent('');
      alert('Reply feature coming soon!');
    }, 500);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </main>
      </div>
    );
  }

  // Error / Not found state
  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {error === 'Thread not found' ? 'Thread Not Found' : 'Oops!'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {error === 'Thread not found'
                  ? "This discussion doesn't exist or may have been removed."
                  : 'Something went wrong while loading this thread.'}
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Link href="/forum">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Browse Forum
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const categoryConfig = FORUM_CATEGORIES[thread.category] || { label: thread.category, emoji: '' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forum
        </Link>

        {/* Thread Content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              {thread.isPinned && (
                <Pin className="h-4 w-4 text-orange-500" />
              )}
              <Badge variant="secondary">
                {categoryConfig.emoji} {categoryConfig.label}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={thread.user?.image || undefined} />
                <AvatarFallback>
                  {(thread.user?.username || 'A').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <Link
                  href={thread.user?.username ? `/user/${thread.user.username}` : '#'}
                  className="font-medium hover:text-orange-500"
                >
                  @{thread.user?.username || 'anonymous'}
                </Link>
                <span className="text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(thread.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t">
              <Button variant="outline" size="sm" className="gap-2">
                <ChevronUp className="h-4 w-4" />
                {thread.upvotes} Upvotes
              </Button>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {thread.replyCount} replies
              </span>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Replies Section */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Replies ({thread.replies?.length || 0})
          </h2>

          {/* Reply Form */}
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSubmitReply}>
                <Textarea
                  placeholder="Share your thoughts..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="mb-3"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className="bg-orange-500 hover:bg-orange-600 gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Reply
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Replies List */}
          {thread.replies && thread.replies.length > 0 ? (
            <div className="space-y-3">
              {thread.replies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.user?.image || undefined} />
                        <AvatarFallback>
                          {(reply.user?.username || 'A').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={reply.user?.username ? `/user/${reply.user.username}` : '#'}
                            className="font-medium text-sm hover:text-orange-500"
                          >
                            @{reply.user?.username || 'anonymous'}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                            <ChevronUp className="h-3 w-3" />
                            {reply.upvotes}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No replies yet. Be the first to share your thoughts!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
