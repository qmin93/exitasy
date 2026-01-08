import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Rate limit: 5 intro requests per day per user
const INTRO_REQUEST_DAILY_LIMIT = 5;

// POST /api/startups/[slug]/intro-request - Request intro to founder
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check buyer access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Only approved buyers or admins can request intro
    const buyerStatus = (user as { buyerStatus?: string }).buyerStatus;
    const hasBuyerAccess =
      user.role === 'ADMIN' ||
      (user.role === 'BUYER' && buyerStatus === 'APPROVED');

    if (!hasBuyerAccess) {
      // Provide specific error messages based on status
      if (user.role === 'FOUNDER') {
        return NextResponse.json(
          { message: 'Founders cannot request intros. Apply as a buyer first.', code: 'FOUNDER_NOT_ALLOWED' },
          { status: 403 }
        );
      }
      if (user.role === 'BUYER' && buyerStatus === 'PENDING') {
        return NextResponse.json(
          { message: 'Your buyer application is pending approval.', code: 'BUYER_PENDING' },
          { status: 403 }
        );
      }
      if (user.role === 'BUYER' && buyerStatus === 'REJECTED') {
        return NextResponse.json(
          { message: 'Your buyer application was not approved.', code: 'BUYER_REJECTED' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { message: 'You need to be an approved buyer to request intros.', code: 'NOT_BUYER' },
        { status: 403 }
      );
    }

    // Rate limit check: 5 intro requests per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRequestCount = await prisma.buyerAccessRequest.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: todayStart },
      },
    });

    if (todayRequestCount >= INTRO_REQUEST_DAILY_LIMIT) {
      return NextResponse.json(
        {
          message: `Daily intro request limit reached (${INTRO_REQUEST_DAILY_LIMIT}/day). Try again tomorrow.`,
          code: 'RATE_LIMIT_EXCEEDED',
          limit: INTRO_REQUEST_DAILY_LIMIT,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const { slug } = await params;
    const body = await req.json();
    const { companyName, message, budgetRange, timeline, buyerType, operatorPlan, linkedin } = body;

    // Validate required fields
    if (!companyName || !message || !budgetRange || !timeline || !buyerType) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the startup
    const startup = await prisma.startup.findUnique({
      where: { slug },
      include: {
        makers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!startup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    // Check if user already sent an access request
    const existingRequest = await prisma.buyerAccessRequest.findUnique({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId: startup.id,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          message: 'You have already sent an intro request for this startup',
          status: existingRequest.status,
        },
        { status: 400 }
      );
    }

    // Create the buyer access request
    const accessRequest = await prisma.buyerAccessRequest.create({
      data: {
        userId: session.user.id,
        startupId: startup.id,
        companyName,
        message,
        budgetRange,
        timeline,
        buyerType,
        operatorPlan: operatorPlan || null,
        linkedinUrl: linkedin || null,
        status: 'NEW',
      },
    });

    // Also create/update BuyerInterest for tracking
    await prisma.buyerInterest.upsert({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId: startup.id,
        },
      },
      create: {
        userId: session.user.id,
        startupId: startup.id,
        isAnonymous: false,
        message: `Intro Request: ${message.substring(0, 100)}...`,
      },
      update: {
        message: `Intro Request: ${message.substring(0, 100)}...`,
      },
    });

    // Update buyer interest count
    await prisma.startup.update({
      where: { id: startup.id },
      data: {
        buyerInterestCount: { increment: 1 },
      },
    });

    // Log the event (INTRO_REQUEST_CREATED for trending score)
    await prisma.eventLog.create({
      data: {
        type: 'INTRO_REQUEST_CREATED',
        startupId: startup.id,
        userId: session.user.id,
        metadata: JSON.stringify({
          companyName,
          budgetRange,
          timeline,
          buyerType,
          requestId: accessRequest.id,
        }),
      },
    });

    // Create notification for founder(s)
    for (const maker of startup.makers) {
      await prisma.notification.create({
        data: {
          userId: maker.userId,
          type: 'BUYER_INTEREST',
          title: 'New Intro Request',
          message: `Someone wants to discuss acquiring ${startup.name}`,
          link: `/dashboard/requests/${accessRequest.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Intro request sent successfully',
      id: accessRequest.id,
      status: 'NEW',
    });
  } catch (error) {
    console.error('Error creating intro request:', error);
    return NextResponse.json(
      { message: 'Failed to send intro request' },
      { status: 500 }
    );
  }
}

// GET /api/startups/[slug]/intro-request - Get user's intro request status
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        hasRequested: false,
        status: null,
      });
    }

    const { slug } = await params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
    });

    if (!startup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    const accessRequest = await prisma.buyerAccessRequest.findUnique({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId: startup.id,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        reviewNote: true,
      },
    });

    return NextResponse.json({
      hasRequested: !!accessRequest,
      requestId: accessRequest?.id || null,
      status: accessRequest?.status || null,
      createdAt: accessRequest?.createdAt || null,
      reviewedAt: accessRequest?.reviewedAt || null,
      reviewNote: accessRequest?.reviewNote || null,
    });
  } catch (error) {
    console.error('Error checking intro request:', error);
    return NextResponse.json(
      { message: 'Failed to check intro request status' },
      { status: 500 }
    );
  }
}
