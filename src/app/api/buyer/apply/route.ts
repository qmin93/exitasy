import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/buyer/apply - Submit buyer application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, buyerStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already a buyer
    if (user.role === 'BUYER') {
      return NextResponse.json(
        { message: 'You have already applied as a buyer', buyerStatus: user.buyerStatus },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { companyName, budgetRange, timeline, buyerType, message, linkedinUrl } = body;

    // Validate required fields
    if (!budgetRange || !timeline || !buyerType || !message) {
      return NextResponse.json(
        { message: 'Missing required fields: budgetRange, timeline, buyerType, message' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 50) {
      return NextResponse.json(
        { message: 'Message must be at least 50 characters' },
        { status: 400 }
      );
    }

    // Validate budget range
    const validBudgets = ['under_10k', '10k_25k', '25k_50k', '50k_100k', '100k_plus'];
    if (!validBudgets.includes(budgetRange)) {
      return NextResponse.json(
        { message: 'Invalid budget range' },
        { status: 400 }
      );
    }

    // Validate timeline
    const validTimelines = ['asap', '1_month', '3_months', 'exploring'];
    if (!validTimelines.includes(timeline)) {
      return NextResponse.json(
        { message: 'Invalid timeline' },
        { status: 400 }
      );
    }

    // Validate buyer type
    const validTypes = ['first_time', 'serial', 'operator', 'investor'];
    if (!validTypes.includes(buyerType)) {
      return NextResponse.json(
        { message: 'Invalid buyer type' },
        { status: 400 }
      );
    }

    // Update user to BUYER with PENDING status
    // Store application details in user bio temporarily (or create separate BuyerApplication model)
    const applicationData = JSON.stringify({
      companyName: companyName || null,
      budgetRange,
      timeline,
      buyerType,
      message,
      linkedinUrl: linkedinUrl || null,
      appliedAt: new Date().toISOString(),
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'BUYER',
        buyerStatus: 'PENDING',
        // Store application data in bio field for now
        // In production, you'd want a separate BuyerApplication model
        bio: applicationData,
      },
      select: {
        id: true,
        role: true,
        buyerStatus: true,
      },
    });

    // Log the event
    await prisma.eventLog.create({
      data: {
        type: 'BUYER_APPLICATION_SUBMITTED',
        userId: user.id,
        metadata: JSON.stringify({
          budgetRange,
          timeline,
          buyerType,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      user: {
        role: updatedUser.role,
        buyerStatus: updatedUser.buyerStatus,
      },
    });
  } catch (error) {
    console.error('Error submitting buyer application:', error);
    return NextResponse.json(
      { message: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// GET /api/buyer/apply - Get current application status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        buyerStatus: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Parse application data if buyer
    let applicationData = null;
    if (user.role === 'BUYER' && user.bio) {
      try {
        applicationData = JSON.parse(user.bio);
      } catch {
        // Bio is not JSON, ignore
      }
    }

    return NextResponse.json({
      role: user.role,
      buyerStatus: user.buyerStatus,
      applicationData,
    });
  } catch (error) {
    console.error('Error getting buyer application status:', error);
    return NextResponse.json(
      { message: 'Failed to get application status' },
      { status: 500 }
    );
  }
}
