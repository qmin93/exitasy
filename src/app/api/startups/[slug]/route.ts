import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/startups/[slug] - Get a single startup
export async function GET(req: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
      include: {
        makers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                bio: true,
                twitter: true,
              },
            },
          },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
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
        },
        revenueSnapshots: {
          orderBy: { recordedAt: 'desc' },
          take: 12,
        },
        _count: {
          select: {
            comments: true,
            guesses: true,
            upvotes: true,
            buyerInterests: true,
          },
        },
      },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Parse JSON string fields
    const parsedStartup = {
      ...startup,
      categories: JSON.parse(startup.categories || '[]'),
      screenshots: JSON.parse(startup.screenshots || '[]'),
      saleIncludes: JSON.parse(startup.saleIncludes || '[]'),
      sellabilityReasons: JSON.parse(startup.sellabilityReasons || '[]'),
    };

    return NextResponse.json(parsedStartup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/startups/[slug] - Update a startup
export async function PUT(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a maker
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

    const isMaker = startup.makers.some(
      (maker: { userId: string }) => maker.userId === session.user.id
    );

    if (!isMaker) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      tagline,
      description,
      website,
      logo,
      screenshots,
      videoUrl,
      categories,
      stage,
      askingPrice,
      saleMultiple,
      saleIncludes,
      saleReason,
    } = body;

    const updatedStartup = await prisma.startup.update({
      where: { slug },
      data: {
        name,
        tagline,
        description,
        website,
        logo,
        screenshots: screenshots ? JSON.stringify(screenshots) : undefined,
        videoUrl,
        categories: categories ? JSON.stringify(categories) : undefined,
        stage,
        askingPrice,
        saleMultiple,
        saleIncludes: saleIncludes ? JSON.stringify(saleIncludes) : undefined,
        saleReason,
      },
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
      },
    });

    // Parse JSON string fields
    const parsedStartup = {
      ...updatedStartup,
      categories: JSON.parse(updatedStartup.categories || '[]'),
      screenshots: JSON.parse(updatedStartup.screenshots || '[]'),
      saleIncludes: JSON.parse(updatedStartup.saleIncludes || '[]'),
      sellabilityReasons: JSON.parse(updatedStartup.sellabilityReasons || '[]'),
    };

    return NextResponse.json(parsedStartup);
  } catch (error) {
    console.error('Error updating startup:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/startups/[slug] - Delete a startup
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a maker
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

    const isMaker = startup.makers.some(
      (maker: { userId: string }) => maker.userId === session.user.id
    );

    if (!isMaker) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.startup.delete({
      where: { slug },
    });

    return NextResponse.json({ message: 'Startup deleted' });
  } catch (error) {
    console.error('Error deleting startup:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
