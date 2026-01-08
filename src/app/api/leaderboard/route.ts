import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/leaderboard - Get top guessers or startups
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'users'; // users, startups
    const limit = parseInt(searchParams.get('limit') || '50');
    const timeRange = searchParams.get('timeRange') || 'all'; // all, week, month

    // Calculate date filter based on timeRange
    let dateFilter: Date | undefined;
    const now = new Date();
    if (timeRange === 'week') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (type === 'startups') {
      // Get startups for leaderboard
      const startups = await prisma.startup.findMany({
        where: {
          verificationStatus: 'VERIFIED',
          ...(dateFilter && {
            createdAt: { gte: dateFilter },
          }),
        },
        orderBy: [
          { upvoteCount: 'desc' },
          { currentMRR: 'desc' },
        ],
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          tagline: true,
          logo: true,
          currentMRR: true,
          growthMoM: true,
          upvoteCount: true,
          stage: true,
          makers: {
            include: {
              user: {
                select: {
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        startups,
        timeRange,
      });
    }

    // Default: Get users with guess stats
    const users = await prisma.user.findMany({
      where: {
        guessAccuracy: { gt: 0 },
        ...(dateFilter && {
          guesses: {
            some: {
              createdAt: { gte: dateFilter },
            },
          },
        }),
      },
      orderBy: [
        { guessAccuracy: 'desc' },
        { guessRank: 'asc' },
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        guessAccuracy: true,
        guessRank: true,
        _count: {
          select: {
            guesses: true,
            startups: true,
          },
        },
      },
    });

    // Calculate ranks
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      accuracy: user.guessAccuracy,
      totalGuesses: user._count.guesses,
      startupsOwned: user._count.startups,
    }));

    // Get total participants
    const totalParticipants = await prisma.user.count({
      where: {
        guessAccuracy: { gt: 0 },
      },
    });

    return NextResponse.json({
      users: leaderboard,
      totalParticipants,
      timeRange,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
