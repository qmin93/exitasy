import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyUpvote } from '@/lib/notifications';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// POST /api/startups/[slug]/upvote - Toggle upvote
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

    const startup = await prisma.startup.findUnique({
      where: { slug },
      include: {
        makers: {
          select: { userId: true },
        },
      },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Get upvoter's name
    const upvoter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, username: true },
    });

    // Check if already upvoted
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId: startup.id,
        },
      },
    });

    if (existingUpvote) {
      // Remove upvote
      await prisma.$transaction([
        prisma.upvote.delete({
          where: { id: existingUpvote.id },
        }),
        prisma.startup.update({
          where: { id: startup.id },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({
        upvoted: false,
        upvoteCount: startup.upvoteCount - 1,
      });
    } else {
      // Add upvote
      await prisma.$transaction([
        prisma.upvote.create({
          data: {
            userId: session.user.id,
            startupId: startup.id,
          },
        }),
        prisma.startup.update({
          where: { id: startup.id },
          data: { upvoteCount: { increment: 1 } },
        }),
      ]);

      // Send notification to startup makers (don't notify yourself)
      const upvoterName = upvoter?.name || upvoter?.username || 'Someone';
      for (const maker of startup.makers) {
        if (maker.userId !== session.user.id) {
          await notifyUpvote(maker.userId, upvoterName, startup.name, startup.slug);
        }
      }

      return NextResponse.json({
        upvoted: true,
        upvoteCount: startup.upvoteCount + 1,
      });
    }
  } catch (error) {
    console.error('Error toggling upvote:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/startups/[slug]/upvote - Check if user upvoted
export async function GET(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json({ upvoted: false });
    }

    const startup = await prisma.startup.findUnique({
      where: { slug },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    const upvote = await prisma.upvote.findUnique({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId: startup.id,
        },
      },
    });

    return NextResponse.json({
      upvoted: !!upvote,
      upvoteCount: startup.upvoteCount,
    });
  } catch (error) {
    console.error('Error checking upvote:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
