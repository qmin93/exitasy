import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/forum - List all forum threads
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { upvotes: 'desc' },
          { createdAt: 'desc' },
        ],
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
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    // Format threads
    const formattedThreads = threads.map((thread) => ({
      ...thread,
      replyCount: thread._count.replies,
    }));

    // Get stats
    const [totalMembers, totalThreads] = await Promise.all([
      prisma.user.count(),
      prisma.forumThread.count(),
    ]);

    return NextResponse.json({
      threads: formattedThreads,
      stats: {
        totalMembers,
        totalThreads,
        onlineNow: Math.floor(Math.random() * 500) + 100, // Mock online count
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/forum - Create a new thread
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, content, category } = body;

    // Validate required fields
    if (!title || !content || !category) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['REVENUE_GROWTH', 'EXIT_STRATEGY', 'ACQUISITION', 'SHOW_TELL', 'AMA'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { message: 'Invalid category' },
        { status: 400 }
      );
    }

    const thread = await prisma.forumThread.create({
      data: {
        title,
        content,
        category,
        userId: session.user.id,
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

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Error creating forum thread:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
