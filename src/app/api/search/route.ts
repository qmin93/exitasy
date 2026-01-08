import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/search - Search startups and users
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, startups, users
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter params
    const category = searchParams.get('category'); // filter by category
    const minMRR = searchParams.get('minMRR'); // minimum MRR
    const maxMRR = searchParams.get('maxMRR'); // maximum MRR
    const stage = searchParams.get('stage'); // startup stage
    const forSale = searchParams.get('forSale'); // only for sale startups

    // Sort params
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, upvotes, mrr, newest
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc

    if (!query || query.length < 2) {
      return NextResponse.json({
        startups: [],
        users: [],
      });
    }

    const searchTerm = query.toLowerCase();

    // Search startups
    let startups: unknown[] = [];
    if (type === 'all' || type === 'startups') {
      // Build where conditions
      const whereConditions: Prisma.StartupWhereInput = {
        OR: [
          { name: { contains: searchTerm } },
          { tagline: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
        verificationStatus: 'VERIFIED',
      };

      // Apply filters
      if (category) {
        whereConditions.categories = { contains: category };
      }
      if (minMRR) {
        whereConditions.currentMRR = {
          ...((whereConditions.currentMRR as object) || {}),
          gte: parseInt(minMRR),
        };
      }
      if (maxMRR) {
        whereConditions.currentMRR = {
          ...((whereConditions.currentMRR as object) || {}),
          lte: parseInt(maxMRR),
        };
      }
      if (stage) {
        whereConditions.stage = stage;
      }
      if (forSale === 'true') {
        whereConditions.stage = 'FOR_SALE';
      }

      // Build orderBy
      let orderBy: Prisma.StartupOrderByWithRelationInput = { upvoteCount: 'desc' };
      switch (sortBy) {
        case 'upvotes':
          orderBy = { upvoteCount: sortOrder as 'asc' | 'desc' };
          break;
        case 'mrr':
          orderBy = { currentMRR: sortOrder as 'asc' | 'desc' };
          break;
        case 'newest':
          orderBy = { launchDate: sortOrder as 'asc' | 'desc' };
          break;
        case 'relevance':
        default:
          orderBy = { upvoteCount: 'desc' };
      }

      const startupResults = await prisma.startup.findMany({
        where: whereConditions,
        take: limit,
        orderBy,
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

      startups = startupResults.map((startup) => ({
        ...startup,
        categories: JSON.parse(startup.categories || '[]'),
        screenshots: JSON.parse(startup.screenshots || '[]'),
      }));
    }

    // Search users
    let users: unknown[] = [];
    if (type === 'all' || type === 'users') {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { username: { contains: searchTerm } },
            { bio: { contains: searchTerm } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          _count: {
            select: {
              startups: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      startups,
      users,
      query,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
