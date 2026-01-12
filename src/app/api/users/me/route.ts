import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        twitter: true,
        location: true,
        guessAccuracy: true,
        guessRank: true,
        totalMRR: true,
        onboardingCompleted: true,
        createdAt: true,
        badges: {
          select: {
            type: true,
            earnedAt: true,
          },
        },
        startups: {
          include: {
            startup: {
              select: {
                id: true,
                name: true,
                slug: true,
                tagline: true,
                logo: true,
                currentMRR: true,
                growthMoM: true,
                verificationStatus: true,
                stage: true,
                categories: true,
                createdAt: true,
                _count: {
                  select: {
                    upvotes: true,
                    comments: true,
                    guesses: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            guesses: true,
            comments: true,
            upvotes: true,
            buyerInterests: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedUser = {
      ...user,
      startups: user.startups.map((sm) => ({
        ...sm.startup,
        upvoteCount: sm.startup._count?.upvotes || 0,
        commentCount: sm.startup._count?.comments || 0,
        guessCount: sm.startup._count?.guesses || 0,
      })),
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
