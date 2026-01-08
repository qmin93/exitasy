import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/forum/[id] - Get a single forum thread
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const thread = await prisma.forumThread.findUnique({
      where: { id },
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
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { message: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...thread,
      replyCount: thread._count.replies,
    });
  } catch (error) {
    console.error('Error fetching forum thread:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
