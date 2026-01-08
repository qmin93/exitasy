'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell, ArrowUp, MessageSquare, Target, Trophy, Heart, Megaphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  UPVOTE: ArrowUp,
  COMMENT: MessageSquare,
  REPLY: MessageSquare,
  GUESS_RESULT: Target,
  BUYER_INTEREST: Heart,
  MILESTONE: Trophy,
  BADGE_EARNED: Trophy,
  SYSTEM: Megaphone,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  UPVOTE: 'text-orange-500',
  COMMENT: 'text-blue-500',
  REPLY: 'text-blue-500',
  GUESS_RESULT: 'text-purple-500',
  BUYER_INTEREST: 'text-pink-500',
  MILESTONE: 'text-yellow-500',
  BADGE_EARNED: 'text-yellow-500',
  SYSTEM: 'text-gray-500',
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications();

  function handleNotificationClick(id: string, isRead: boolean) {
    if (!isRead) {
      markAsRead([id]);
    }
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Link
            href="/notifications"
            className="text-xs text-orange-500 hover:underline"
            onClick={() => setIsOpen(false)}
          >
            View all
          </Link>
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notification.type] || 'text-gray-500';

                const content = (
                  <div
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer',
                      !notification.isRead && 'bg-orange-50/50'
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                  >
                    <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', colorClass)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !notification.isRead && 'font-medium')}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" />
                    )}
                  </div>
                );

                if (notification.link) {
                  return (
                    <Link key={notification.id} href={notification.link}>
                      {content}
                    </Link>
                  );
                }

                return <div key={notification.id}>{content}</div>;
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full text-orange-500">
                See all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
