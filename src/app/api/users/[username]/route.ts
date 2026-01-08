import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ username: string }>;
}

// GET /api/users/[username] - Get user profile
export async function GET(req: Request, context: RouteContext) {
  try {
    const { username } = await context.params;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        website: true,
        twitter: true,
        location: true,
        guessAccuracy: true,
        guessRank: true,
        totalMRR: true,
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
                verificationStatus: true,
                stage: true,
                upvoteCount: true,
              },
            },
          },
        },
        _count: {
          select: {
            guesses: true,
            comments: true,
            upvotes: true,
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
      startups: user.startups.map((sm) => sm.startup),
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[username] - Update user profile
export async function PUT(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { username } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || currentUser.username !== username.toLowerCase()) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, bio, website, twitter, location, image } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name !== undefined ? name : currentUser.name,
        bio: bio !== undefined ? bio : currentUser.bio,
        website: website !== undefined ? website : currentUser.website,
        twitter: twitter !== undefined ? twitter : currentUser.twitter,
        location: location !== undefined ? location : currentUser.location,
        image: image !== undefined ? image : currentUser.image,
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        website: true,
        twitter: true,
        location: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
