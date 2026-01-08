import prisma from './prisma';

type NotificationType =
  | 'UPVOTE'
  | 'COMMENT'
  | 'REPLY'
  | 'GUESS_RESULT'
  | 'BUYER_INTEREST'
  | 'MILESTONE'
  | 'BADGE_EARNED'
  | 'SYSTEM';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Create a notification for a user
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// Notify when someone upvotes a startup
export async function notifyUpvote(
  startupMakerId: string,
  upvoterName: string,
  startupName: string,
  startupSlug: string
) {
  return createNotification({
    userId: startupMakerId,
    type: 'UPVOTE',
    title: 'New upvote!',
    message: `${upvoterName} upvoted your startup "${startupName}"`,
    link: `/startup/${startupSlug}`,
  });
}

// Notify when someone comments on a startup
export async function notifyComment(
  startupMakerId: string,
  commenterName: string,
  startupName: string,
  startupSlug: string
) {
  return createNotification({
    userId: startupMakerId,
    type: 'COMMENT',
    title: 'New comment!',
    message: `${commenterName} commented on your startup "${startupName}"`,
    link: `/startup/${startupSlug}#comments`,
  });
}

// Notify when someone replies to a comment
export async function notifyReply(
  originalCommenterId: string,
  replierName: string,
  startupName: string,
  startupSlug: string
) {
  return createNotification({
    userId: originalCommenterId,
    type: 'REPLY',
    title: 'New reply!',
    message: `${replierName} replied to your comment on "${startupName}"`,
    link: `/startup/${startupSlug}#comments`,
  });
}

// Notify when a guess result is revealed
export async function notifyGuessResult(
  userId: string,
  startupName: string,
  startupSlug: string,
  isCorrect: boolean
) {
  return createNotification({
    userId,
    type: 'GUESS_RESULT',
    title: isCorrect ? 'Correct guess!' : 'MRR revealed',
    message: isCorrect
      ? `Your MRR guess for "${startupName}" was correct!`
      : `The actual MRR for "${startupName}" has been revealed. Check if you were close!`,
    link: `/startup/${startupSlug}`,
  });
}

// Notify when someone expresses buyer interest
export async function notifyBuyerInterest(
  startupMakerId: string,
  startupName: string,
  startupSlug: string
) {
  return createNotification({
    userId: startupMakerId,
    type: 'BUYER_INTEREST',
    title: 'New buyer interest!',
    message: `Someone is interested in buying "${startupName}"`,
    link: `/startup/${startupSlug}`,
  });
}

// Notify when a milestone is reached
export async function notifyMilestone(
  userId: string,
  milestoneType: string,
  value: number,
  startupName?: string,
  startupSlug?: string
) {
  let message = '';
  switch (milestoneType) {
    case 'upvotes':
      message = startupName
        ? `"${startupName}" reached ${value} upvotes!`
        : `You reached ${value} total upvotes!`;
      break;
    case 'guesses':
      message = `You've made ${value} guesses! Keep guessing to climb the leaderboard.`;
      break;
    case 'accuracy':
      message = `Your guess accuracy is now ${value}%! You're in the top guessers.`;
      break;
    default:
      message = `Congratulations on reaching a new milestone!`;
  }

  return createNotification({
    userId,
    type: 'MILESTONE',
    title: 'Milestone reached!',
    message,
    link: startupSlug ? `/startup/${startupSlug}` : '/leaderboard',
  });
}

// Notify when a badge is earned
export async function notifyBadgeEarned(userId: string, badgeType: string) {
  const badgeNames: Record<string, string> = {
    MAKER: 'Maker',
    VERIFIED_SELLER: 'Verified Seller',
    TOP_GUESSER: 'Top Guesser',
    REVENUE_100K: '$100K Revenue',
    SOLD_STARTUP: 'Sold a Startup',
    EARLY_ADOPTER: 'Early Adopter',
  };

  return createNotification({
    userId,
    type: 'BADGE_EARNED',
    title: 'New badge earned!',
    message: `You've earned the "${badgeNames[badgeType] || badgeType}" badge!`,
    link: '/settings',
  });
}

// Send a system notification to a user
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  return createNotification({
    userId,
    type: 'SYSTEM',
    title,
    message,
    link,
  });
}
