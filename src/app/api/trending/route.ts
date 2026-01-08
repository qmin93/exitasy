import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Type for TrendingSnapshot (will be available after prisma generate)
interface TrendingSnapshotWithStartup {
  id: string;
  startupId: string;
  score: number;
  window: string;
  upvoteScore: number;
  commentScore: number;
  guessScore: number;
  introRequestScore: number;
  introAcceptedBonus: number;
  statusMultiplier: number;
  calculatedAt: Date;
  startup: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    logo: string | null;
    verificationStatus: string;
    stage: string;
    currentMRR: number;
    growthMoM: number;
    askingPrice: number | null;
    saleMultiple: number | null;
    upvoteCount: number;
    launchDate: Date | null;
    createdAt: Date;
    categories: string;
    makers: Array<{
      user: {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }>;
    _count: {
      comments: number;
      guesses: number;
      upvotes: number;
      buyerInterests: number;
      buyerAccessRequests: number;
    };
  };
}

/**
 * Trending API v5.0 - Snapshot-Based Query
 *
 * Uses pre-calculated TrendingSnapshot for fast queries.
 * Snapshots are updated hourly via /api/trending/recalculate (Vercel Cron).
 *
 * Query Parameters:
 * - limit: number of results (default: 10)
 * - period: "7d" | "24h" (default: "7d")
 * - type: "trending" | "today" | "for_sale" | "hot" | "new" (default: "trending")
 */

type RankingType = 'trending' | 'today' | 'for_sale' | 'hot' | 'new';

// GET /api/trending - Get trending startups from snapshots
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || '7d';
    const type = (searchParams.get('type') || 'trending') as RankingType;

    const now = new Date();
    const window = period === '24h' ? '24h' : '7d';

    // Build where clause based on ranking type
    let stageFilter: string[] | undefined;
    let createdAtFilter: Date | undefined;

    if (type === 'today') {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      createdAtFilter = todayStart;
    } else if (type === 'for_sale') {
      stageFilter = ['FOR_SALE', 'EXIT_READY'];
    } else if (type === 'new') {
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      createdAtFilter = twoDaysAgo;
    }

    // Check if we have snapshots
    const snapshotCount = await prisma.trendingSnapshot.count({
      where: { window },
    });

    // If no snapshots exist, trigger recalculation and fallback to legacy calculation
    if (snapshotCount === 0) {
      return await legacyTrendingCalculation(req, limit, period, type);
    }

    // Get startups with their snapshots
    const snapshots = await prisma.trendingSnapshot.findMany({
      where: { window },
      orderBy: { score: 'desc' },
      include: {
        startup: {
          include: {
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
                buyerAccessRequests: true,
              },
            },
          },
        },
      },
    });

    // Filter based on type
    let filteredSnapshots = (snapshots as TrendingSnapshotWithStartup[]).filter((s: TrendingSnapshotWithStartup) => {
      const startup = s.startup;
      if (!startup) return false;

      if (stageFilter && !stageFilter.includes(startup.stage)) {
        return false;
      }

      if (createdAtFilter && startup.createdAt < createdAtFilter) {
        return false;
      }

      return true;
    });

    // For 'hot' type, prioritize recent activity
    if (type === 'hot') {
      filteredSnapshots = filteredSnapshots.sort((a: TrendingSnapshotWithStartup, b: TrendingSnapshotWithStartup) => {
        const aRecent = (a.upvoteScore || 0) + (a.commentScore || 0);
        const bRecent = (b.upvoteScore || 0) + (b.commentScore || 0);
        return bRecent - aRecent;
      });
    }

    // Limit results
    const topSnapshots = filteredSnapshots.slice(0, limit);

    // Format response
    const startups = topSnapshots.map((snapshot: TrendingSnapshotWithStartup) => {
      const startup = snapshot.startup;
      const hoursAgo = startup.launchDate
        ? (now.getTime() - startup.launchDate.getTime()) / (1000 * 60 * 60)
        : (now.getTime() - startup.createdAt.getTime()) / (1000 * 60 * 60);

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
        trendScore: snapshot.score,
        trendDetails: {
          upvoteScore: snapshot.upvoteScore,
          commentScore: snapshot.commentScore,
          guessScore: snapshot.guessScore,
          introRequestScore: snapshot.introRequestScore,
          introAcceptedBonus: snapshot.introAcceptedBonus,
          statusMultiplier: snapshot.statusMultiplier,
          calculatedAt: snapshot.calculatedAt,
          window: snapshot.window,
        },
        whyTrending: generateWhyTrending(
          snapshot,
          hoursAgo,
          startup.verificationStatus === 'VERIFIED',
          ['FOR_SALE', 'EXIT_READY'].includes(startup.stage),
          type
        ),
      };
    });

    // Get latest calculation time
    const latestCalc = snapshots.length > 0
      ? snapshots[0].calculatedAt
      : null;

    return NextResponse.json({
      startups,
      type,
      period,
      window,
      snapshotBased: true,
      calculatedAt: latestCalc?.toISOString() || now.toISOString(),
      weights: {
        INTRO_REQUEST: 12,
        INTRO_ACCEPTED_BONUS: 8,
        GUESS: 6,
        COMMENT: 3,
        UPVOTE: 2,
        VERIFIED_MULT: 1.15,
        FOR_SALE_MULT: 1.1,
        SOLD_MULT: 0.2,
      },
      halfLifeHours: 36,
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate human-readable "why trending" text
 */
function generateWhyTrending(
  snapshot: {
    upvoteScore: number;
    commentScore: number;
    guessScore: number;
    introRequestScore: number;
    introAcceptedBonus: number;
  },
  hoursAgo: number,
  isVerified: boolean,
  isForSale: boolean,
  type: RankingType
): string {
  const parts: string[] = [];

  // Score-based metrics (approximate back to counts)
  const upvotes = Math.round(snapshot.upvoteScore / 2) || 0;
  const comments = Math.round(snapshot.commentScore / 3) || 0;
  const guesses = Math.round(snapshot.guessScore / 6) || 0;
  const intros = Math.round(snapshot.introRequestScore / 12) || 0;

  if (intros > 0) {
    parts.push(`${intros} intro${intros > 1 ? 's' : ''} requested`);
  }
  if (upvotes > 0) {
    parts.push(`${upvotes} upvote${upvotes > 1 ? 's' : ''}`);
  }
  if (comments > 0) {
    parts.push(`${comments} comment${comments > 1 ? 's' : ''}`);
  }
  if (guesses > 0 && type !== 'for_sale') {
    parts.push(`${guesses} guess${guesses !== 1 ? 'es' : ''}`);
  }

  // Status badges
  const badges: string[] = [];
  if (isVerified) badges.push('Verified');
  if (isForSale) badges.push('For Sale');
  if (snapshot.introAcceptedBonus > 0) badges.push('Active Deal');

  // Time context
  let timeStr = '';
  if (hoursAgo < 24) timeStr = 'today';
  else if (hoursAgo < 48) timeStr = 'yesterday';
  else if (hoursAgo < 168) timeStr = 'this week';

  // Build final string
  if (type === 'today') {
    return parts.length > 0 ? `${parts.join(', ')} today` : 'Launched today';
  }

  if (type === 'for_sale') {
    const dealInfo = parts.length > 0 ? parts.join(', ') : 'Active listing';
    return isVerified ? `${dealInfo} (Verified)` : dealInfo;
  }

  if (type === 'hot') {
    return parts.length > 0 ? `${parts.join(', ')} recently` : 'Getting attention';
  }

  if (type === 'new') {
    return hoursAgo < 24
      ? `Just launched${parts.length > 0 ? ` - ${parts.join(', ')}` : ''}`
      : `New ${timeStr}`;
  }

  // Default trending
  const engagementStr = parts.length > 0 ? parts.join(', ') : '';
  const badgeStr = badges.length > 0 ? ` (${badges.join(', ')})` : '';
  const timeContext = timeStr ? ` ${timeStr}` : '';

  // Boost indicators
  let boostStr = '';
  if (snapshot.introAcceptedBonus > 0) {
    boostStr = ' 🔥';
  } else if (snapshot.introRequestScore > 0) {
    boostStr = ' ⚡';
  }

  return engagementStr
    ? `${engagementStr}${timeContext}${badgeStr}${boostStr}`
    : `Recently launched${badgeStr}${boostStr}`;
}

/**
 * Legacy calculation fallback (when no snapshots exist)
 */
async function legacyTrendingCalculation(
  _req: Request,
  limit: number,
  period: string,
  type: RankingType
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Build where clause
  const whereClause: Record<string, unknown> = {};

  if (type === 'today') {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    whereClause.createdAt = { gte: todayStart };
  } else if (type === 'for_sale') {
    whereClause.stage = { in: ['FOR_SALE', 'EXIT_READY'] };
  } else if (type === 'new') {
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    whereClause.createdAt = { gte: twoDaysAgo };
  }

  const startups = await prisma.startup.findMany({
    where: whereClause,
    include: {
      upvotes: {
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true },
      },
      comments: {
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true },
      },
      guesses: {
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true },
      },
      buyerAccessRequests: {
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true, status: true },
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
          buyerAccessRequests: true,
        },
      },
    },
  });

  // Calculate scores with v5.0 weights
  const scoredStartups = startups.map((startup) => {
    const halfLifeHours = 36;

    const upvoteScore = startup.upvotes.reduce((sum, u) => {
      const hoursAgo = (now.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + 2 * Math.pow(0.5, hoursAgo / halfLifeHours);
    }, 0);

    const commentScore = startup.comments.reduce((sum, c) => {
      const hoursAgo = (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + 3 * Math.pow(0.5, hoursAgo / halfLifeHours);
    }, 0);

    const guessScore = startup.guesses.reduce((sum, g) => {
      const hoursAgo = (now.getTime() - g.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + 6 * Math.pow(0.5, hoursAgo / halfLifeHours);
    }, 0);

    const introScore = startup.buyerAccessRequests.reduce((sum, i) => {
      const hoursAgo = (now.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60);
      const baseScore = 12 * Math.pow(0.5, hoursAgo / halfLifeHours);
      const acceptedBonus = i.status === 'ACCEPTED' ? 8 * Math.pow(0.5, hoursAgo / halfLifeHours) : 0;
      return sum + baseScore + acceptedBonus;
    }, 0);

    const baseScore = upvoteScore + commentScore + guessScore + introScore;

    // Status multiplier
    let statusMult = 1.0;
    if (startup.verificationStatus === 'VERIFIED') statusMult *= 1.15;
    if (startup.stage === 'SOLD') statusMult *= 0.2;
    else if (['FOR_SALE', 'EXIT_READY'].includes(startup.stage)) statusMult *= 1.1;

    const trendScore = Math.log(1 + baseScore) * 100 * statusMult;

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
        upvoteScore: Math.round(upvoteScore * 100) / 100,
        commentScore: Math.round(commentScore * 100) / 100,
        guessScore: Math.round(guessScore * 100) / 100,
        introRequestScore: Math.round(introScore * 100) / 100,
        statusMultiplier: statusMult,
        legacy: true,
      },
      whyTrending: 'Calculating...',
    };
  });

  scoredStartups.sort((a, b) => b.trendScore - a.trendScore);
  const topResults = scoredStartups.slice(0, limit);

  return NextResponse.json({
    startups: topResults,
    type,
    period,
    snapshotBased: false,
    calculatedAt: now.toISOString(),
    message: 'Using legacy calculation. Run POST /api/trending/recalculate to generate snapshots.',
  });
}
