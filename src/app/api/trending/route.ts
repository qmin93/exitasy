import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Trending Score Weights (Phase 3 Formula v2.0)
const WEIGHTS = {
  UPVOTE: 2,
  COMMENT: 3,
  GUESS: 1,
  VERIFIED_BONUS: 15,           // Verified products get trust bonus
  FOR_SALE_BONUS: 10,           // For sale products get visibility bonus
  RECENT_ACTIVITY_MAX: 20,      // Max bonus for recent activity
  RECENCY_DECAY_HOURS: 168,     // 7 days for recency decay
  FOUNDER_COMMENT_BONUS: 5,     // Bonus when founder participates in comments
  TOP_GUESSER_ENGAGEMENT: 3,    // Bonus for top guesser engagement
};

// Recency Weight Multiplier (more recent = higher multiplier)
function getRecencyWeight(hoursAgo: number): number {
  if (hoursAgo <= 24) return 1.5;      // Last 24h: ×1.5
  if (hoursAgo <= 72) return 1.2;      // Last 3 days: ×1.2
  if (hoursAgo <= 168) return 1.0;     // Last 7 days: ×1.0
  return 0.8;                          // Older: ×0.8
}

// Ranking types
type RankingType = 'trending' | 'today' | 'for_sale' | 'hot' | 'new';

// GET /api/trending - Get trending startups with advanced scoring
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || '7d'; // 24h, 7d, 30d
    const type = (searchParams.get('type') || 'trending') as RankingType;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build where clause based on ranking type
    const whereClause: Record<string, unknown> = {};

    if (type === 'today') {
      // Today's launches only
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: todayStart };
    } else if (type === 'for_sale') {
      // For sale products only
      whereClause.stage = { in: ['FOR_SALE', 'EXIT_READY'] };
    } else if (type === 'new') {
      // New launches (last 48 hours)
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      whereClause.createdAt = { gte: twoDaysAgo };
    }
    // 'trending' and 'hot' use all verified startups

    // Get startups with engagement data
    const startups = await prisma.startup.findMany({
      where: whereClause,
      include: {
        upvotes: {
          where: {
            createdAt: { gte: startDate },
          },
          select: { id: true, createdAt: true },
        },
        comments: {
          where: {
            createdAt: { gte: startDate },
          },
          select: { id: true, createdAt: true, userId: true },
        },
        guesses: {
          where: {
            createdAt: { gte: startDate },
          },
          select: { id: true, createdAt: true },
        },
        makers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            guesses: true,
            upvotes: true,
            buyerInterests: true,
          },
        },
      },
    });

    // Calculate trend scores based on type
    const scoredStartups = startups.map((startup) => {
      const upvotesPeriod = startup.upvotes.length;
      const commentsPeriod = startup.comments.length;
      const guessesPeriod = startup.guesses.length;

      // Calculate recent activity bonus (activity in last 24h gets extra weight)
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentUpvotes = startup.upvotes.filter(u => u.createdAt >= last24h).length;
      const recentComments = startup.comments.filter(c => c.createdAt >= last24h).length;
      const recentActivity = (recentUpvotes + recentComments * 2);
      const recentActivityBonus = Math.min(recentActivity * 2, WEIGHTS.RECENT_ACTIVITY_MAX);

      // Recency decay: newer startups get bonus
      const launchDate = startup.launchDate || startup.createdAt;
      const hoursAgo = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);
      const recencyBonus = Math.max(0, 1 - (hoursAgo / WEIGHTS.RECENCY_DECAY_HOURS)) * 15;

      // Verified bonus
      const verifiedBonus = startup.verificationStatus === 'VERIFIED' ? WEIGHTS.VERIFIED_BONUS : 0;

      // For Sale bonus
      const forSaleBonus = ['FOR_SALE', 'EXIT_READY'].includes(startup.stage) ? WEIGHTS.FOR_SALE_BONUS : 0;

      // Founder comment participation bonus
      const founderIds = startup.makers.map(m => m.user.id);
      const hasFounderComment = startup.comments.some(c => founderIds.includes(c.userId));
      const founderCommentBonus = hasFounderComment ? WEIGHTS.FOUNDER_COMMENT_BONUS : 0;

      // Recency weight multiplier
      const recencyWeight = getRecencyWeight(hoursAgo);

      // Calculate score based on type
      let trendScore: number;
      let scoreBreakdown: Record<string, number>;

      switch (type) {
        case 'today':
          // Today's launches: engagement + recency heavy
          trendScore =
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            (guessesPeriod * WEIGHTS.GUESS) +
            recentActivityBonus +
            verifiedBonus;
          scoreBreakdown = {
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT) + (guessesPeriod * WEIGHTS.GUESS),
            recentActivity: recentActivityBonus,
            verified: verifiedBonus,
          };
          break;

        case 'for_sale':
          // For sale: engagement + sale attractiveness (multiple, price)
          const multipleBonus = startup.saleMultiple ? Math.min(startup.saleMultiple, 5) * 2 : 0;
          const interestBonus = (startup._count.buyerInterests || 0) * 3;
          trendScore =
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            multipleBonus +
            interestBonus +
            verifiedBonus +
            recencyBonus;
          scoreBreakdown = {
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT),
            dealAttractiveness: multipleBonus + interestBonus,
            verified: verifiedBonus,
            recency: recencyBonus,
          };
          break;

        case 'hot':
          // Hot: recent activity heavy
          trendScore =
            recentActivityBonus * 2 +
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            verifiedBonus;
          scoreBreakdown = {
            recentActivity: recentActivityBonus * 2,
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT),
            verified: verifiedBonus,
          };
          break;

        case 'new':
          // New: pure recency + engagement
          trendScore =
            recencyBonus * 2 +
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            verifiedBonus;
          scoreBreakdown = {
            recency: recencyBonus * 2,
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT),
            verified: verifiedBonus,
          };
          break;

        case 'trending':
        default:
          // Trending: balanced formula (Phase 3 v2.0)
          // Base score from engagement
          const baseScore =
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            (guessesPeriod * WEIGHTS.GUESS) +
            recentActivityBonus +
            recencyBonus +
            verifiedBonus +
            forSaleBonus +
            founderCommentBonus;

          // Apply recency weight multiplier to final score
          trendScore = baseScore * recencyWeight;

          scoreBreakdown = {
            upvotes: upvotesPeriod * WEIGHTS.UPVOTE,
            comments: commentsPeriod * WEIGHTS.COMMENT,
            guesses: guessesPeriod * WEIGHTS.GUESS,
            recentActivity: recentActivityBonus,
            recency: recencyBonus,
            verified: verifiedBonus,
            forSale: forSaleBonus,
            founderEngagement: founderCommentBonus,
            recencyMultiplier: recencyWeight,
          };
          break;
      }

      return {
        id: startup.id,
        name: startup.name,
        slug: startup.slug,
        tagline: startup.tagline,
        logo: startup.logo,
        verificationStatus: startup.verificationStatus,
        stage: startup.stage,
        currentMRR: startup.currentMRR,
        growthMoM: startup.growthMoM,
        askingPrice: startup.askingPrice,
        saleMultiple: startup.saleMultiple,
        upvoteCount: startup.upvoteCount,
        launchDate: startup.launchDate,
        createdAt: startup.createdAt,
        makers: startup.makers,
        categories: startup.categories,
        _count: startup._count,
        trendScore: Math.round(trendScore * 100) / 100,
        trendDetails: {
          upvotesPeriod,
          commentsPeriod,
          guessesPeriod,
          recentActivityBonus: Math.round(recentActivityBonus * 100) / 100,
          recencyBonus: Math.round(recencyBonus * 100) / 100,
          recencyWeight,
          verifiedBonus,
          forSaleBonus,
          founderCommentBonus,
          hasFounderComment,
          scoreBreakdown,
        },
        whyTrending: generateWhyTrending(
          upvotesPeriod,
          commentsPeriod,
          guessesPeriod,
          hoursAgo,
          startup.verificationStatus === 'VERIFIED',
          ['FOR_SALE', 'EXIT_READY'].includes(startup.stage),
          hasFounderComment,
          recencyWeight,
          type
        ),
      };
    });

    // Sort by trend score and limit
    scoredStartups.sort((a, b) => b.trendScore - a.trendScore);
    const topResults = scoredStartups.slice(0, limit);

    return NextResponse.json({
      startups: topResults,
      type,
      period,
      weights: WEIGHTS,
      calculatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateWhyTrending(
  upvotes: number,
  comments: number,
  guesses: number,
  hoursAgo: number,
  isVerified: boolean,
  isForSale: boolean,
  hasFounderComment: boolean,
  recencyWeight: number,
  type: RankingType
): string {
  const parts: string[] = [];

  // Add engagement stats
  if (upvotes > 0) {
    parts.push(`${upvotes} upvote${upvotes > 1 ? 's' : ''}`);
  }
  if (comments > 0) {
    parts.push(`${comments} comment${comments > 1 ? 's' : ''}`);
  }
  if (guesses > 0 && type !== 'for_sale') {
    parts.push(`${guesses} guess${guesses !== 1 ? 'es' : ''}`);
  }

  // Add status badges
  const badges: string[] = [];
  if (isVerified) badges.push('Verified');
  if (isForSale) badges.push('For Sale');
  if (hasFounderComment) badges.push('Founder Active');

  // Time context
  let timeStr = '';
  if (hoursAgo < 24) {
    timeStr = 'today';
  } else if (hoursAgo < 48) {
    timeStr = 'yesterday';
  } else if (hoursAgo < 168) {
    timeStr = 'this week';
  }

  // Build final string based on type
  if (type === 'today') {
    return parts.length > 0
      ? `${parts.join(', ')} today`
      : 'Launched today';
  }

  if (type === 'for_sale') {
    const dealInfo = parts.length > 0 ? parts.join(', ') : 'Active listing';
    return isVerified ? `${dealInfo} (Verified)` : dealInfo;
  }

  if (type === 'hot') {
    return parts.length > 0
      ? `${parts.join(', ')} recently`
      : 'Getting attention';
  }

  if (type === 'new') {
    return hoursAgo < 24
      ? `Just launched ${parts.length > 0 ? `- ${parts.join(', ')}` : ''}`
      : `New ${timeStr}`;
  }

  // Default trending
  const engagementStr = parts.length > 0 ? parts.join(', ') : '';
  const badgeStr = badges.length > 0 ? ` (${badges.join(', ')})` : '';
  const timeContext = timeStr ? ` ${timeStr}` : '';

  // Add recency weight indicator
  let boostStr = '';
  if (recencyWeight >= 1.5) {
    boostStr = ' 🔥';
  } else if (recencyWeight >= 1.2) {
    boostStr = ' ⚡';
  }

  return engagementStr
    ? `${engagementStr}${timeContext}${badgeStr}${boostStr}`
    : `Recently launched${badgeStr}${boostStr}`;
}
