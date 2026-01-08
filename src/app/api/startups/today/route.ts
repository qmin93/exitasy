import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/startups/today - Get startups by time period with trending score
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'today';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'trending';

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let endDate: Date = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    switch (period) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday':
        startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        endDate = today;
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = today;
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      verificationStatus: 'VERIFIED',
      OR: [
        {
          launchDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      ],
    };

    // For trending sort, we need to calculate trend scores
    // trend_score = upvotes*2 + comments*3 + guesses*1 + recency_decay
    let orderBy: Record<string, string | Record<string, string>> = { createdAt: 'desc' };

    if (sort === 'trending') {
      // First try to use cached trend scores
      orderBy = { upvoteCount: 'desc' }; // Fallback to upvotes as proxy
    } else if (sort === 'upvotes') {
      orderBy = { upvoteCount: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { launchDate: 'desc' };
    } else if (sort === 'mrr') {
      orderBy = { currentMRR: 'desc' };
    }

    const [startups, total] = await Promise.all([
      prisma.startup.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
          trendScore: true,
          _count: {
            select: {
              comments: true,
              guesses: true,
              buyerInterests: true,
              follows: true,
            },
          },
        },
      }),
      prisma.startup.count({ where }),
    ]);

    // Calculate inline trend scores if not cached
    const startupsWithTrend = startups.map((startup) => {
      const hoursAgo = (now.getTime() - new Date(startup.launchDate || startup.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyDecay = Math.max(0, 1 - (hoursAgo / 168)); // Decay over 7 days

      const trendScore = startup.trendScore?.score ?? (
        (startup.upvoteCount * 2) +
        (startup._count.comments * 3) +
        (startup._count.guesses * 1) +
        (recencyDecay * 10)
      );

      return {
        ...startup,
        categories: JSON.parse(startup.categories || '[]'),
        screenshots: JSON.parse(startup.screenshots || '[]'),
        saleIncludes: JSON.parse(startup.saleIncludes || '[]'),
        sellabilityReasons: JSON.parse(startup.sellabilityReasons || '[]'),
        trendScore,
        trendDetails: {
          upvotes: startup.upvoteCount,
          comments: startup._count.comments,
          guesses: startup._count.guesses,
          recencyBonus: Math.round(recencyDecay * 10),
        },
      };
    });

    // Sort by trend score if trending
    if (sort === 'trending') {
      startupsWithTrend.sort((a, b) => (b.trendScore as number) - (a.trendScore as number));
    }

    return NextResponse.json({
      startups: startupsWithTrend,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching today startups:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
