import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/founder/dashboard - Get founder dashboard data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all startups where user is a maker
    const userStartups = await prisma.startupMaker.findMany({
      where: { userId: session.user.id },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currentMRR: true,
            stage: true,
            askingPrice: true,
            upvoteCount: true,
            commentCount: true,
            guessCount: true,
            buyerInterestCount: true,
            todayRank: true,
            createdAt: true,
          },
        },
      },
    });

    const startupIds = userStartups.map((s) => s.startupId);

    if (startupIds.length === 0) {
      return NextResponse.json({
        startups: [],
        todaySnapshot: {
          totalUpvotes: 0,
          totalComments: 0,
          totalGuesses: 0,
          totalBuyerInterest: 0,
        },
        buyerPipeline: {
          pending: 0,
          approved: 0,
          rejected: 0,
          requests: [],
        },
        recentActivity: [],
      });
    }

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's activity stats
    const [todayUpvotes, todayComments, todayGuesses] = await Promise.all([
      prisma.upvote.count({
        where: {
          startupId: { in: startupIds },
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.comment.count({
        where: {
          startupId: { in: startupIds },
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.guess.count({
        where: {
          startupId: { in: startupIds },
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    // Get buyer pipeline
    const accessRequests = await prisma.buyerAccessRequest.findMany({
      where: { startupId: { in: startupIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            plan: true,
          },
        },
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const pipelineCounts = await prisma.buyerAccessRequest.groupBy({
      by: ['status'],
      where: { startupId: { in: startupIds } },
      _count: true,
    });

    const pipelineCountMap = pipelineCounts.reduce(
      (acc, c) => {
        acc[c.status] = c._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.eventLog.findMany({
      where: {
        startupId: { in: startupIds },
        createdAt: { gte: sevenDaysAgo },
        type: {
          in: [
            'UPVOTED',
            'COMMENTED',
            'GUESSED',
            'INTRO_REQUESTED',
            'ACCESS_APPROVED',
            'ACCESS_REJECTED',
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate totals
    const totals = userStartups.reduce(
      (acc, s) => ({
        totalUpvotes: acc.totalUpvotes + s.startup.upvoteCount,
        totalComments: acc.totalComments + s.startup.commentCount,
        totalGuesses: acc.totalGuesses + s.startup.guessCount,
        totalBuyerInterest: acc.totalBuyerInterest + s.startup.buyerInterestCount,
        totalMRR: acc.totalMRR + s.startup.currentMRR,
      }),
      {
        totalUpvotes: 0,
        totalComments: 0,
        totalGuesses: 0,
        totalBuyerInterest: 0,
        totalMRR: 0,
      }
    );

    return NextResponse.json({
      startups: userStartups.map((s) => s.startup),
      todaySnapshot: {
        upvotesToday: todayUpvotes,
        commentsToday: todayComments,
        guessesToday: todayGuesses,
        ...totals,
      },
      buyerPipeline: {
        pending: pipelineCountMap.PENDING || 0,
        approved: pipelineCountMap.APPROVED || 0,
        rejected: pipelineCountMap.REJECTED || 0,
        requests: accessRequests,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
