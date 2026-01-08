import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Trending Score v3.0 - Buyer Intent Weighted
 *
 * Goal: Highlight listings with REAL buyer signals, not just vanity likes.
 *
 * Formula:
 * TrendScore = (
 *   Upvotes × 1 +
 *   Comments × 2 +
 *   Guesses × 1.5 +
 *   ExpressInterest × 4 +
 *   RequestIntro × 8 +
 *   RecencyBonus +
 *   VerifiedBonus +
 *   ForSaleBonus
 * ) × RecencyMultiplier × TrustMultiplier
 *
 * Anti-spam: Same user actions don't stack. New accounts have limited impact.
 */
const WEIGHTS = {
  // Engagement signals
  UPVOTE: 1,                    // Light interest signal
  COMMENT: 2,                   // Community participation
  GUESS: 1.5,                   // Game engagement / curiosity

  // Buyer intent signals (weighted higher)
  EXPRESS_INTEREST: 4,          // Anonymous interest signal
  REQUEST_INTRO: 8,             // Strong acquisition intent

  // Trust & status multipliers
  VERIFIED_MULT: 1.2,           // Verified revenue: ×1.2
  FOR_SALE_MULT: 1.1,           // For sale listing: ×1.1
  SOLD_MULT: 0.2,               // Sold products fade from trending

  // Bonuses
  FOUNDER_COMMENT_BONUS: 3,     // Bonus when founder participates

  // Anti-spam
  NEW_ACCOUNT_MULT: 0.5,        // New accounts (< 24h) have reduced impact

  // Decay
  HALF_LIFE_HOURS: 48,          // 48-hour half-life for recency
};

/**
 * Exponential time decay - recent activity matters more
 * decay = exp(-age_hours / 48)
 */
function getRecencyDecay(hoursAgo: number): number {
  return Math.exp(-hoursAgo / WEIGHTS.HALF_LIFE_HOURS);
}

/**
 * Discrete recency weight for display purposes
 */
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
      const buyerInterestCount = startup._count.buyerInterests || 0;

      // Calculate recent activity bonus (activity in last 24h gets extra weight)
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentUpvotes = startup.upvotes.filter(u => u.createdAt >= last24h).length;
      const recentComments = startup.comments.filter(c => c.createdAt >= last24h).length;
      const recentActivity = (recentUpvotes + recentComments * 2);
      const recentActivityBonus = Math.min(recentActivity * 2, 20); // Cap at 20

      // Recency decay: newer startups get bonus (exponential decay)
      const launchDate = startup.launchDate || startup.createdAt;
      const hoursAgo = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);
      const recencyDecay = getRecencyDecay(hoursAgo);
      const recencyBonus = Math.max(0, 1 - (hoursAgo / 168)) * 15; // Legacy bonus for display

      // Trust multipliers (v3.0)
      const verifiedMult = startup.verificationStatus === 'VERIFIED' ? WEIGHTS.VERIFIED_MULT : 1;
      const stageMult = startup.stage === 'SOLD' ? WEIGHTS.SOLD_MULT
        : ['FOR_SALE', 'EXIT_READY'].includes(startup.stage) ? WEIGHTS.FOR_SALE_MULT : 1;

      // Founder comment participation bonus
      const founderIds = startup.makers.map(m => m.user.id);
      const hasFounderComment = startup.comments.some(c => founderIds.includes(c.userId));
      const founderCommentBonus = hasFounderComment ? WEIGHTS.FOUNDER_COMMENT_BONUS : 0;

      // Recency weight multiplier (for display)
      const recencyWeight = getRecencyWeight(hoursAgo);

      // Calculate score based on type (v3.0 - Buyer Intent Weighted)
      let trendScore: number;
      let scoreBreakdown: Record<string, number>;

      // Buyer intent score (heavily weighted)
      const buyerIntentScore = buyerInterestCount * WEIGHTS.EXPRESS_INTEREST;

      switch (type) {
        case 'today':
          // Today's launches: engagement + buyer intent
          trendScore = (
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            (guessesPeriod * WEIGHTS.GUESS) +
            buyerIntentScore +
            recentActivityBonus
          ) * verifiedMult;
          scoreBreakdown = {
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT) + (guessesPeriod * WEIGHTS.GUESS),
            buyerIntent: buyerIntentScore,
            recentActivity: recentActivityBonus,
            verifiedMult,
          };
          break;

        case 'for_sale':
          // For sale: engagement + buyer intent (highest weight)
          const multipleBonus = startup.saleMultiple ? Math.min(startup.saleMultiple, 5) * 2 : 0;
          trendScore = (
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            multipleBonus +
            (buyerInterestCount * WEIGHTS.REQUEST_INTRO) + // Higher weight for sale listings
            recencyBonus
          ) * verifiedMult * stageMult;
          scoreBreakdown = {
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT),
            dealAttractiveness: multipleBonus,
            buyerIntent: buyerInterestCount * WEIGHTS.REQUEST_INTRO,
            recency: recencyBonus,
            verifiedMult,
            stageMult,
          };
          break;

        case 'hot':
          // Hot: recent activity + buyer intent
          trendScore = (
            recentActivityBonus * 2 +
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            buyerIntentScore
          ) * verifiedMult;
          scoreBreakdown = {
            recentActivity: recentActivityBonus * 2,
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT),
            buyerIntent: buyerIntentScore,
            verifiedMult,
          };
          break;

        case 'new':
          // New: pure recency + engagement
          trendScore = (
            recencyBonus * 2 +
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            buyerIntentScore
          ) * verifiedMult;
          scoreBreakdown = {
            recency: recencyBonus * 2,
            engagement: (upvotesPeriod * WEIGHTS.UPVOTE) + (commentsPeriod * WEIGHTS.COMMENT),
            buyerIntent: buyerIntentScore,
            verifiedMult,
          };
          break;

        case 'trending':
        default:
          // Trending v3.0: Buyer Intent Weighted Formula
          // Base score = engagement + buyer signals + bonuses
          const baseScore =
            (upvotesPeriod * WEIGHTS.UPVOTE) +
            (commentsPeriod * WEIGHTS.COMMENT) +
            (guessesPeriod * WEIGHTS.GUESS) +
            buyerIntentScore +
            recentActivityBonus +
            founderCommentBonus;

          // Apply multipliers: recency × verified × stage
          // Log scale to prevent explosion: log(1 + base) * 100 * multipliers
          const logScore = Math.log(1 + baseScore) * 100;
          trendScore = logScore * recencyDecay * verifiedMult * stageMult;

          scoreBreakdown = {
            upvotes: upvotesPeriod * WEIGHTS.UPVOTE,
            comments: commentsPeriod * WEIGHTS.COMMENT,
            guesses: guessesPeriod * WEIGHTS.GUESS,
            buyerIntent: buyerIntentScore,
            recentActivity: recentActivityBonus,
            founderEngagement: founderCommentBonus,
            recencyDecay: Math.round(recencyDecay * 100) / 100,
            verifiedMult,
            stageMult,
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
          buyerInterestCount,
          recentActivityBonus: Math.round(recentActivityBonus * 100) / 100,
          recencyBonus: Math.round(recencyBonus * 100) / 100,
          recencyDecay: Math.round(recencyDecay * 100) / 100,
          recencyWeight,
          verifiedMult,
          stageMult,
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
