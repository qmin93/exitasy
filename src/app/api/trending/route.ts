import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/trending - Get trending startups with score breakdown
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || '7d'; // 24h, 7d, 30d

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

    // Get verified startups
    const startups = await prisma.startup.findMany({
      where: {
        verificationStatus: 'VERIFIED',
      },
      include: {
        upvotes: {
          where: {
            createdAt: { gte: startDate },
          },
          select: { id: true },
        },
        comments: {
          where: {
            createdAt: { gte: startDate },
          },
          select: { id: true },
        },
        guesses: {
          where: {
            createdAt: { gte: startDate },
          },
          select: { id: true },
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
      },
    });

    // Calculate trend scores
    const trendingStartups = startups.map((startup) => {
      const upvotes7d = startup.upvotes.length;
      const comments7d = startup.comments.length;
      const guesses7d = startup.guesses.length;

      // Recency decay: newer startups get bonus
      const launchDate = startup.launchDate || startup.createdAt;
      const hoursAgo = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);
      const recencyBonus = Math.max(0, 1 - (hoursAgo / 168)) * 10; // Decay over 7 days

      // Trend score formula: upvotes*2 + comments*3 + guesses*1 + recency_bonus
      const trendScore = (upvotes7d * 2) + (comments7d * 3) + (guesses7d * 1) + recencyBonus;

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
        upvoteCount: startup.upvoteCount,
        launchDate: startup.launchDate,
        makers: startup.makers,
        trendScore: Math.round(trendScore * 100) / 100,
        trendDetails: {
          upvotes7d,
          comments7d,
          guesses7d,
          recencyBonus: Math.round(recencyBonus * 100) / 100,
          formula: `${upvotes7d}×2 + ${comments7d}×3 + ${guesses7d}×1 + ${recencyBonus.toFixed(1)} recency`,
        },
        whyTrending: generateWhyTrending(upvotes7d, comments7d, guesses7d, hoursAgo),
      };
    });

    // Sort by trend score and limit
    trendingStartups.sort((a, b) => b.trendScore - a.trendScore);
    const topTrending = trendingStartups.slice(0, limit);

    return NextResponse.json({
      startups: topTrending,
      period,
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

function generateWhyTrending(upvotes: number, comments: number, guesses: number, hoursAgo: number): string {
  const parts: string[] = [];

  if (upvotes > 0) {
    parts.push(`${upvotes} upvote${upvotes > 1 ? 's' : ''}`);
  }
  if (comments > 0) {
    parts.push(`${comments} comment${comments > 1 ? 's' : ''}`);
  }
  if (guesses > 0) {
    parts.push(`${guesses} guess${guesses !== 1 ? 'es' : ''}`);
  }

  const timeStr = hoursAgo < 24
    ? 'in last 24h'
    : hoursAgo < 168
    ? 'this week'
    : 'recently';

  return parts.length > 0
    ? `${parts.join(', ')} ${timeStr}`
    : 'Recently launched';
}
