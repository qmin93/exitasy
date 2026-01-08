import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { IntroRequestStatus } from '@prisma/client';

// GET /api/founder/access-requests/[id] - Get specific request details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const request = await prisma.buyerAccessRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true,
            bio: true,
            website: true,
            twitter: true,
            plan: true,
            totalGuesses: true,
            guessAccuracy: true,
            createdAt: true,
          },
        },
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currentMRR: true,
            askingPrice: true,
            stage: true,
            makers: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Check if user is a maker of this startup
    const isMaker = request.startup.makers.some(
      (m) => m.userId === session.user.id
    );

    if (!isMaker) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error('Error fetching access request:', error);
    return NextResponse.json(
      { message: 'Failed to fetch access request' },
      { status: 500 }
    );
  }
}

// PATCH /api/founder/access-requests/[id] - Approve or reject request
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, reviewNote } = body;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Use APPROVE or REJECT' },
        { status: 400 }
      );
    }

    // Get the request
    const request = await prisma.buyerAccessRequest.findUnique({
      where: { id },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            makers: {
              select: { userId: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Check if user is a maker of this startup
    const isMaker = request.startup.makers.some(
      (m) => m.userId === session.user.id
    );

    if (!isMaker) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Update the request
    const newStatus = action === 'APPROVE' ? IntroRequestStatus.ACCEPTED : IntroRequestStatus.DECLINED;

    const updatedRequest = await prisma.buyerAccessRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });

    // Notify the buyer
    await prisma.notification.create({
      data: {
        userId: request.user.id,
        type: action === 'APPROVE' ? 'BUYER_INTEREST' : 'SYSTEM',
        title:
          action === 'APPROVE'
            ? 'Intro Request Approved! 🎉'
            : 'Intro Request Update',
        message:
          action === 'APPROVE'
            ? `Your intro request for ${request.startup.name} has been approved. You can now access deal details.`
            : `Your intro request for ${request.startup.name} was not approved at this time.`,
        link: `/startup/${request.startup.slug}`,
      },
    });

    // Log the event
    await prisma.eventLog.create({
      data: {
        type: action === 'APPROVE' ? 'ACCESS_APPROVED' : 'ACCESS_REJECTED',
        startupId: request.startup.id,
        userId: session.user.id,
        metadata: JSON.stringify({
          requestId: id,
          buyerId: request.user.id,
          reviewNote: reviewNote || null,
        }),
      },
    });

    // If approved, upgrade user role/plan if needed
    if (action === 'APPROVE') {
      // Upgrade user to buyer role with approved status
      await prisma.user.update({
        where: { id: request.user.id },
        data: {
          role: 'BUYER',
          buyerStatus: 'APPROVED',
        },
      });
    } else if (action === 'REJECT') {
      // If rejecting, set buyerStatus to REJECTED (keep role as is)
      await prisma.user.update({
        where: { id: request.user.id },
        data: {
          buyerStatus: 'REJECTED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action.toLowerCase()}ed successfully`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating access request:', error);
    return NextResponse.json(
      { message: 'Failed to update access request' },
      { status: 500 }
    );
  }
}
