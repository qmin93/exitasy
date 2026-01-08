import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// POST /api/startups/[slug]/interest - Express buyer interest
export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { isAnonymous, message } = await req.json();

    const startup = await prisma.startup.findUnique({
      where: { slug },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Check if startup is for sale
    if (startup.stage !== 'FOR_SALE' && startup.stage !== 'EXIT_READY') {
      return NextResponse.json(
        { message: 'This startup is not for sale' },
        { status: 400 }
      );
    }

    // Check if user already expressed interest
    const existingInterest = await prisma.buyerInterest.findUnique({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId: startup.id,
        },
      },
    });

    if (existingInterest) {
      return NextResponse.json(
        { message: 'You already expressed interest in this startup' },
        { status: 409 }
      );
    }

    // Create buyer interest
    const interest = await prisma.buyerInterest.create({
      data: {
        userId: session.user.id,
        startupId: startup.id,
        isAnonymous: isAnonymous ?? true,
        message,
      },
    });

    // Update startup interest count
    await prisma.startup.update({
      where: { id: startup.id },
      data: { buyerInterestCount: { increment: 1 } },
    });

    return NextResponse.json(interest, { status: 201 });
  } catch (error) {
    console.error('Error expressing interest:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/startups/[slug]/interest - Get interest count (for makers only: full list)
export async function GET(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
      include: {
        makers: true,
      },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Check if user is a maker
    const isMaker = session?.user?.id
      ? startup.makers.some((maker: { userId: string }) => maker.userId === session.user.id)
      : false;

    // Check if current user expressed interest
    let hasExpressedInterest = false;
    if (session?.user?.id) {
      const userInterest = await prisma.buyerInterest.findUnique({
        where: {
          userId_startupId: {
            userId: session.user.id,
            startupId: startup.id,
          },
        },
      });
      hasExpressedInterest = !!userInterest;
    }

    // If maker, return full list
    if (isMaker) {
      const interests = await prisma.buyerInterest.findMany({
        where: { startupId: startup.id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        count: startup.buyerInterestCount,
        interests: interests.map((interest) => ({
          ...interest,
          user: interest.isAnonymous
            ? { id: interest.user.id, name: 'Anonymous Buyer' }
            : interest.user,
        })),
        hasExpressedInterest,
        isMaker: true,
      });
    }

    // For non-makers, return only count
    return NextResponse.json({
      count: startup.buyerInterestCount,
      hasExpressedInterest,
      isMaker: false,
    });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
