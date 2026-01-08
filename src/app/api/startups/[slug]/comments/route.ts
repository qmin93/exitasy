import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyComment, notifyReply } from '@/lib/notifications';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/startups/[slug]/comments - Get comments
export async function GET(req: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const startup = await prisma.startup.findUnique({
      where: { slug },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          startupId: startup.id,
          parentId: null, // Only top-level comments
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
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
      }),
      prisma.comment.count({
        where: {
          startupId: startup.id,
          parentId: null,
        },
      }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/startups/[slug]/comments - Create a comment
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

    const { content, parentId } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
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

    // Get commenter info
    const commenter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, username: true },
    });
    const commenterName = commenter?.name || commenter?.username || 'Someone';

    // If parentId is provided, verify parent comment exists
    let parentComment = null;
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, userId: true, startupId: true },
      });

      if (!parentComment || parentComment.startupId !== startup.id) {
        return NextResponse.json(
          { message: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        startupId: startup.id,
        parentId,
      },
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
    });

    // Update startup comment count
    await prisma.startup.update({
      where: { id: startup.id },
      data: { commentCount: { increment: 1 } },
    });

    // Send notifications
    if (parentComment) {
      // This is a reply - notify the parent comment author
      if (parentComment.userId !== session.user.id) {
        await notifyReply(parentComment.userId, commenterName, startup.name, startup.slug);
      }
    } else {
      // This is a top-level comment - notify startup makers
      for (const maker of startup.makers) {
        if (maker.userId !== session.user.id) {
          await notifyComment(maker.userId, commenterName, startup.name, startup.slug);
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
