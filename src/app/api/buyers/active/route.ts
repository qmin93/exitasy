import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/buyers/active - Get active buyers (users who expressed interest recently)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);

    // Get users who have expressed buyer interest in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find users with buyer interests or access requests
    const activeBuyers = await prisma.user.findMany({
      where: {
        OR: [
          {
            buyerInterests: {
              some: {
                createdAt: { gte: sevenDaysAgo },
              },
            },
          },
          {
            buyerAccessRequests: {
              some: {
                createdAt: { gte: sevenDaysAgo },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        plan: true,
        _count: {
          select: {
            buyerInterests: true,
            buyerAccessRequests: true,
          },
        },
      },
      orderBy: [
        {
          buyerAccessRequests: {
            _count: 'desc',
          },
        },
      ],
      take: limit,
    });

    // Transform data
    const buyers = activeBuyers.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      plan: user.plan,
      interestedCount: user._count.buyerInterests + user._count.buyerAccessRequests,
    }));

    return NextResponse.json({
      buyers,
      total: buyers.length,
    });
  } catch (error) {
    console.error('Error fetching active buyers:', error);
    return NextResponse.json(
      { message: 'Failed to fetch active buyers', buyers: [] },
      { status: 500 }
    );
  }
}
