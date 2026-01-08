import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Trending Score v5.0 - EventLog-Based Recalculation
 *
 * Weights:
 * - INTRO_REQUEST_CREATED: 12 (strong acquisition intent)
 * - INTRO_REQUEST_ACCEPTED: +8 bonus (deal in progress)
 * - GUESS: 6 (market curiosity)
 * - COMMENT: 3 (community participation)
 * - UPVOTE: 2 (light interest)
 *
 * Half-life: 36 hours (event impact halves every 36 hours)
 * decay = 0.5 ^ (hoursAgo / 36)
 *
 * Status Multipliers:
 * - verified: 1.15x
 * - for_sale: 1.1x
 * - sold: 0.2x
 */

const HALF_LIFE_HOURS = 36;

const WEIGHTS: Record<string, number> = {
  // EventLog types
  INTRO_REQUEST_CREATED: 12,
  INTRO_REQUEST_ACCEPTED: 8, // Bonus on top of CREATED
  GUESS_SUBMIT: 6,
  GUESS_MRR: 6,
  GUESSED: 6,
  COMMENT_CREATED: 3,
  COMMENTED: 3,
  UPVOTE: 2,
  UPVOTED: 2,
  INTEREST_EXPRESS: 4,
  INTEREST_CLICK: 4,

  // Status multipliers
  VERIFIED_MULT: 1.15,
  FOR_SALE_MULT: 1.1,
  SOLD_MULT: 0.2,
};

/**
 * Half-life decay function
 * At t=0: decay = 1.0
 * At t=36h: decay = 0.5
 * At t=72h: decay = 0.25
 */
function decay(hoursAgo: number): number {
  return Math.pow(0.5, hoursAgo / HALF_LIFE_HOURS);
}

/**
 * Get weight for event type
 */
function getWeight(eventType: string): number {
  // Check exact match first
  if (WEIGHTS[eventType] !== undefined) {
    return WEIGHTS[eventType];
  }

  // Check prefixes for flexibility
  if (eventType.includes('INTRO') && eventType.includes('ACCEPT')) {
    return WEIGHTS.INTRO_REQUEST_ACCEPTED;
  }
  if (eventType.includes('INTRO') && eventType.includes('CREATE')) {
    return WEIGHTS.INTRO_REQUEST_CREATED;
  }
  if (eventType.includes('GUESS')) {
    return WEIGHTS.GUESS_SUBMIT;
  }
  if (eventType.includes('COMMENT')) {
    return WEIGHTS.COMMENT_CREATED;
  }
  if (eventType.includes('UPVOTE')) {
    return WEIGHTS.UPVOTE;
  }
  if (eventType.includes('INTEREST')) {
    return WEIGHTS.INTEREST_EXPRESS;
  }

  return 0;
}

/**
 * Get status multiplier for startup
 */
function getStatusMultiplier(
  verificationStatus: string,
  stage: string
): number {
  let multiplier = 1.0;

  // Verification multiplier
  if (verificationStatus === 'VERIFIED') {
    multiplier *= WEIGHTS.VERIFIED_MULT;
  }

  // Stage multiplier
  if (stage === 'SOLD') {
    multiplier *= WEIGHTS.SOLD_MULT;
  } else if (['FOR_SALE', 'EXIT_READY'].includes(stage)) {
    multiplier *= WEIGHTS.FOR_SALE_MULT;
  }

  return multiplier;
}

// POST /api/trending/recalculate - Recalculate all trending scores
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (for Vercel Cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if: no CRON_SECRET set (dev), or Authorization matches, or API key matches
    const isAuthorized =
      !cronSecret ||
      authHeader === `Bearer ${cronSecret}` ||
      request.headers.get('x-api-key') === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const windowConfigs = [
      { window: '7d', hours: 7 * 24 },
      { window: '24h', hours: 24 },
    ];

    // Get all startups
    const startups = await prisma.startup.findMany({
      select: {
        id: true,
        verificationStatus: true,
        stage: true,
      },
    });

    const results: Array<{
      startupId: string;
      window: string;
      score: number;
    }> = [];

    for (const windowConfig of windowConfigs) {
      const startDate = new Date(now.getTime() - windowConfig.hours * 60 * 60 * 1000);

      // Get EventLog entries for all startups in this window
      const eventLogs = await prisma.eventLog.findMany({
        where: {
          createdAt: { gte: startDate },
          startupId: { not: null },
        },
        select: {
          startupId: true,
          type: true,
          createdAt: true,
          userId: true,
        },
      });

      // Also get direct engagement data (for fallback/accuracy)
      const upvotes = await prisma.upvote.findMany({
        where: { createdAt: { gte: startDate } },
        select: { startupId: true, createdAt: true },
      });

      const comments = await prisma.comment.findMany({
        where: { createdAt: { gte: startDate } },
        select: { startupId: true, createdAt: true },
      });

      const guesses = await prisma.guess.findMany({
        where: { createdAt: { gte: startDate } },
        select: { startupId: true, createdAt: true },
      });

      // Get intro requests
      const introRequests = await prisma.buyerAccessRequest.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          startupId: true,
          createdAt: true,
          status: true,
          reviewedAt: true,
        },
      });

      // Calculate scores for each startup
      for (const startup of startups) {
        let upvoteScore = 0;
        let commentScore = 0;
        let guessScore = 0;
        let introRequestScore = 0;
        let introAcceptedBonus = 0;

        // Calculate from EventLog
        const startupEvents = eventLogs.filter(e => e.startupId === startup.id);
        for (const event of startupEvents) {
          const hoursAgo = (now.getTime() - event.createdAt.getTime()) / (1000 * 60 * 60);
          const eventDecay = decay(hoursAgo);
          const weight = getWeight(event.type);

          // Categorize for breakdown
          if (event.type.includes('UPVOTE')) {
            upvoteScore += weight * eventDecay;
          } else if (event.type.includes('COMMENT')) {
            commentScore += weight * eventDecay;
          } else if (event.type.includes('GUESS')) {
            guessScore += weight * eventDecay;
          } else if (event.type.includes('INTRO')) {
            if (event.type.includes('ACCEPT')) {
              introAcceptedBonus += weight * eventDecay;
            } else {
              introRequestScore += weight * eventDecay;
            }
          }
        }

        // Supplement with direct data (in case EventLog is incomplete)
        const startupUpvotes = upvotes.filter(u => u.startupId === startup.id);
        for (const upvote of startupUpvotes) {
          const hoursAgo = (now.getTime() - upvote.createdAt.getTime()) / (1000 * 60 * 60);
          const eventDecay = decay(hoursAgo);
          // Only add if not already counted from EventLog
          if (!startupEvents.some(e => e.type.includes('UPVOTE'))) {
            upvoteScore += WEIGHTS.UPVOTE * eventDecay;
          }
        }

        const startupComments = comments.filter(c => c.startupId === startup.id);
        for (const comment of startupComments) {
          const hoursAgo = (now.getTime() - comment.createdAt.getTime()) / (1000 * 60 * 60);
          const eventDecay = decay(hoursAgo);
          if (!startupEvents.some(e => e.type.includes('COMMENT'))) {
            commentScore += WEIGHTS.COMMENT_CREATED * eventDecay;
          }
        }

        const startupGuesses = guesses.filter(g => g.startupId === startup.id);
        for (const guess of startupGuesses) {
          const hoursAgo = (now.getTime() - guess.createdAt.getTime()) / (1000 * 60 * 60);
          const eventDecay = decay(hoursAgo);
          if (!startupEvents.some(e => e.type.includes('GUESS'))) {
            guessScore += WEIGHTS.GUESS_SUBMIT * eventDecay;
          }
        }

        // Calculate intro request scores
        const startupIntros = introRequests.filter(i => i.startupId === startup.id);
        for (const intro of startupIntros) {
          const createdHoursAgo = (now.getTime() - intro.createdAt.getTime()) / (1000 * 60 * 60);
          const createdDecay = decay(createdHoursAgo);

          // Add intro request score
          if (!startupEvents.some(e => e.type.includes('INTRO_REQUEST_CREATED'))) {
            introRequestScore += WEIGHTS.INTRO_REQUEST_CREATED * createdDecay;
          }

          // Add accepted bonus if applicable
          if (intro.status === 'ACCEPTED' && intro.reviewedAt) {
            const acceptedHoursAgo = (now.getTime() - intro.reviewedAt.getTime()) / (1000 * 60 * 60);
            const acceptedDecay = decay(acceptedHoursAgo);
            if (!startupEvents.some(e => e.type.includes('INTRO_REQUEST_ACCEPTED'))) {
              introAcceptedBonus += WEIGHTS.INTRO_REQUEST_ACCEPTED * acceptedDecay;
            }
          }
        }

        // Calculate total base score
        const baseScore = upvoteScore + commentScore + guessScore + introRequestScore + introAcceptedBonus;

        // Apply status multiplier
        const statusMultiplier = getStatusMultiplier(startup.verificationStatus, startup.stage);

        // Final score: log scale to prevent explosion
        const finalScore = Math.log(1 + baseScore) * 100 * statusMultiplier;

        // Upsert TrendingSnapshot
        await prisma.trendingSnapshot.upsert({
          where: {
            startupId_window: {
              startupId: startup.id,
              window: windowConfig.window,
            },
          },
          create: {
            startupId: startup.id,
            window: windowConfig.window,
            score: Math.round(finalScore * 100) / 100,
            upvoteScore: Math.round(upvoteScore * 100) / 100,
            commentScore: Math.round(commentScore * 100) / 100,
            guessScore: Math.round(guessScore * 100) / 100,
            introRequestScore: Math.round(introRequestScore * 100) / 100,
            introAcceptedBonus: Math.round(introAcceptedBonus * 100) / 100,
            statusMultiplier,
            calculatedAt: now,
          },
          update: {
            score: Math.round(finalScore * 100) / 100,
            upvoteScore: Math.round(upvoteScore * 100) / 100,
            commentScore: Math.round(commentScore * 100) / 100,
            guessScore: Math.round(guessScore * 100) / 100,
            introRequestScore: Math.round(introRequestScore * 100) / 100,
            introAcceptedBonus: Math.round(introAcceptedBonus * 100) / 100,
            statusMultiplier,
            calculatedAt: now,
          },
        });

        results.push({
          startupId: startup.id,
          window: windowConfig.window,
          score: Math.round(finalScore * 100) / 100,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Recalculated ${results.length} trending snapshots`,
      calculatedAt: now.toISOString(),
      weights: {
        INTRO_REQUEST_CREATED: WEIGHTS.INTRO_REQUEST_CREATED,
        INTRO_REQUEST_ACCEPTED: WEIGHTS.INTRO_REQUEST_ACCEPTED,
        GUESS: WEIGHTS.GUESS_SUBMIT,
        COMMENT: WEIGHTS.COMMENT_CREATED,
        UPVOTE: WEIGHTS.UPVOTE,
      },
      halfLifeHours: HALF_LIFE_HOURS,
      windows: windowConfigs.map(w => w.window),
      startupsProcessed: startups.length,
    });
  } catch (error) {
    console.error('Error recalculating trending scores:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate trending scores' },
      { status: 500 }
    );
  }
}

// GET for manual triggering / health check
export async function GET() {
  try {
    // Get latest calculation time
    const latestSnapshot = await prisma.trendingSnapshot.findFirst({
      orderBy: { calculatedAt: 'desc' },
      select: { calculatedAt: true, window: true },
    });

    const snapshotCount = await prisma.trendingSnapshot.count();

    return NextResponse.json({
      status: 'healthy',
      latestCalculation: latestSnapshot?.calculatedAt?.toISOString() || null,
      snapshotCount,
      config: {
        halfLifeHours: HALF_LIFE_HOURS,
        weights: {
          INTRO_REQUEST_CREATED: WEIGHTS.INTRO_REQUEST_CREATED,
          INTRO_REQUEST_ACCEPTED: WEIGHTS.INTRO_REQUEST_ACCEPTED,
          GUESS: WEIGHTS.GUESS_SUBMIT,
          COMMENT: WEIGHTS.COMMENT_CREATED,
          UPVOTE: WEIGHTS.UPVOTE,
        },
      },
    });
  } catch (error) {
    console.error('Error checking recalculate status:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
