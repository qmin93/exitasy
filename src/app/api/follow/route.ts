import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/follow - Get user's followed startups
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { userId: session.user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
                  follows: true,
                },
              },
            },
          },
        },
      }),
      prisma.follow.count({ where: { userId: session.user.id } }),
    ]);

    const startups = follows.map((f) => ({
      ...f.startup,
      categories: JSON.parse(f.startup.categories || '[]'),
      screenshots: JSON.parse(f.startup.screenshots || '[]'),
      followedAt: f.createdAt,
    }));

    return NextResponse.json({
      startups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/follow - Follow a startup
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { startupId } = await req.json();

    if (!startupId) {
      return NextResponse.json(
        { message: 'Startup ID is required' },
        { status: 400 }
      );
    }

    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { message: 'Already following', isFollowing: true },
        { status: 200 }
      );
    }

    // Create follow
    const follow = await prisma.follow.create({
      data: {
        userId: session.user.id,
        startupId,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        type: 'FOLLOWED',
        startupId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: 'Now following',
      follow,
      isFollowing: true,
    });
  } catch (error) {
    console.error('Error following startup:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/follow - Unfollow a startup
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get('startupId');

    if (!startupId) {
      return NextResponse.json(
        { message: 'Startup ID is required' },
        { status: 400 }
      );
    }

    // Delete follow
    await prisma.follow.deleteMany({
      where: {
        userId: session.user.id,
        startupId,
      },
    });

    return NextResponse.json({
      message: 'Unfollowed',
      isFollowing: false,
    });
  } catch (error) {
    console.error('Error unfollowing startup:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
