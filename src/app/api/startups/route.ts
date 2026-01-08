import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/startups - List all startups
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const stage = searchParams.get('stage');
    const forSale = searchParams.get('forSale') === 'true';
    const sort = searchParams.get('sort') || 'latest';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      verificationStatus: 'VERIFIED',
    };

    if (forSale) {
      // Filter for startups that are for sale
      where.OR = [
        { stage: 'FOR_SALE' },
        { stage: 'EXIT_READY' },
      ];
    } else if (stage) {
      where.stage = stage;
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sort === 'upvotes') {
      orderBy = { upvoteCount: 'desc' };
    } else if (sort === 'mrr') {
      orderBy = { currentMRR: 'desc' };
    } else if (sort === 'growth') {
      orderBy = { growthMoM: 'desc' };
    }

    const [startups, total] = await Promise.all([
      prisma.startup.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
              buyerInterests: true,
            },
          },
        },
      }),
      prisma.startup.count({ where }),
    ]);

    // Parse JSON string fields
    const parsedStartups = startups.map((startup) => ({
      ...startup,
      categories: JSON.parse(startup.categories || '[]'),
      screenshots: JSON.parse(startup.screenshots || '[]'),
      saleIncludes: JSON.parse(startup.saleIncludes || '[]'),
      sellabilityReasons: JSON.parse(startup.sellabilityReasons || '[]'),
    }));

    return NextResponse.json({
      startups: parsedStartups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching startups:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/startups - Create a new startup
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
      sellabilityReasons,
    } = body;

    // Validate required fields
    if (!name || !tagline || !description || !website) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.startup.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create startup
    const startup = await prisma.startup.create({
      data: {
        name,
        slug,
        tagline,
        description,
        website,
        logo,
        screenshots: JSON.stringify(screenshots || []),
        videoUrl,
        categories: JSON.stringify(categories || []),
        stage: stage || 'MAKING_MONEY',
        askingPrice,
        saleMultiple,
        saleIncludes: JSON.stringify(saleIncludes || []),
        saleReason,
        sellabilityReasons: JSON.stringify(sellabilityReasons || []),
        makers: {
          create: {
            userId: session.user.id,
            role: 'founder',
          },
        },
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

    // Parse JSON fields for response
    const parsedStartup = {
      ...startup,
      categories: JSON.parse(startup.categories || '[]'),
      screenshots: JSON.parse(startup.screenshots || '[]'),
      saleIncludes: JSON.parse(startup.saleIncludes || '[]'),
      sellabilityReasons: JSON.parse(startup.sellabilityReasons || '[]'),
    };

    return NextResponse.json(parsedStartup, { status: 201 });
  } catch (error) {
    console.error('Error creating startup:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
