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
    const category = searchParams.get('category');
    const verifiedOnly = searchParams.get('verifiedOnly') !== 'false'; // Default to verified only
    const minMRR = searchParams.get('minMRR') ? parseInt(searchParams.get('minMRR')!) : undefined;
    const maxMRR = searchParams.get('maxMRR') ? parseInt(searchParams.get('maxMRR')!) : undefined;
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Verification filter
    if (verifiedOnly) {
      where.verificationStatus = 'VERIFIED';
    }

    // Stage filters
    if (forSale) {
      where.OR = [
        { stage: 'FOR_SALE' },
        { stage: 'EXIT_READY' },
      ];
    } else if (stage) {
      where.stage = stage;
    }

    // Category filter
    if (category) {
      where.categories = {
        contains: category,
      };
    }

    // MRR range filter
    if (minMRR !== undefined || maxMRR !== undefined) {
      where.currentMRR = {};
      if (minMRR !== undefined) {
        (where.currentMRR as Record<string, number>).gte = minMRR;
      }
      if (maxMRR !== undefined) {
        (where.currentMRR as Record<string, number>).lte = maxMRR;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, string> | Record<string, string>[] = { createdAt: 'desc' };
    switch (sort) {
      case 'upvotes':
      case 'trending':
        orderBy = { upvoteCount: 'desc' };
        break;
      case 'mrr':
      case 'highest_mrr':
        orderBy = { currentMRR: 'desc' };
        break;
      case 'growth':
      case 'highest_growth':
        orderBy = { growthMoM: 'desc' };
        break;
      case 'newest':
      case 'latest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_guessed':
        orderBy = { guessCount: 'desc' };
        break;
      case 'most_comments':
        orderBy = { commentCount: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
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
          trendScore: true,
          _count: {
            select: {
              comments: true,
              guesses: true,
              buyerInterests: true,
              follows: true,
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
      filters: {
        stage,
        category,
        sort,
        minMRR,
        maxMRR,
        search,
      },
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
