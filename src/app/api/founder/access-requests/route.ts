import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/founder/access-requests - Get all access requests for founder's startups
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // PENDING, APPROVED, REJECTED, or all

    // Get all startups where user is a maker
    const userStartups = await prisma.startupMaker.findMany({
      where: { userId: session.user.id },
      select: { startupId: true },
    });

    const startupIds = userStartups.map((s) => s.startupId);

    if (startupIds.length === 0) {
      return NextResponse.json({ requests: [], total: 0 });
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      startupId: { in: startupIds },
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get access requests
    const requests = await prisma.buyerAccessRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true,
            bio: true,
            plan: true,
            totalGuesses: true,
            guessAccuracy: true,
          },
        },
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currentMRR: true,
            askingPrice: true,
            stage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get counts by status
    const counts = await prisma.buyerAccessRequest.groupBy({
      by: ['status'],
      where: { startupId: { in: startupIds } },
      _count: true,
    });

    const countMap = counts.reduce(
      (acc, c) => {
        acc[c.status] = c._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      requests,
      total: requests.length,
      counts: {
        pending: countMap.PENDING || 0,
        approved: countMap.APPROVED || 0,
        rejected: countMap.REJECTED || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch access requests' },
      { status: 500 }
    );
  }
}
