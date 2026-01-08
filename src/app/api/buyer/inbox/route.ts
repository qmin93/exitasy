import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireUser,
  requireBuyerApproved,
  handleAuthError,
  AuthorizationError,
} from '@/lib/authz';

// GET /api/buyer/inbox - Get buyer's sent intro requests
export async function GET() {
  try {
    const user = await requireUser();
    // Any user can view their own requests, not just approved buyers
    // requireBuyerApproved(user);

    // Get all intro requests sent by this buyer
    const requests = await prisma.buyerAccessRequest.findMany({
      where: { userId: user.id },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            tagline: true,
            currentMRR: true,
            askingPrice: true,
            stage: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by status for easy filtering
    const statusCounts = {
      NEW: 0,
      ACCEPTED: 0,
      DECLINED: 0,
      CONNECTED: 0,
    };

    requests.forEach((req) => {
      if (req.status in statusCounts) {
        statusCounts[req.status as keyof typeof statusCounts]++;
      }
    });

    return NextResponse.json({
      requests,
      statusCounts,
      total: requests.length,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return handleAuthError(error);
    }
    console.error('Error fetching buyer inbox:', error);
    return NextResponse.json(
      { message: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}
