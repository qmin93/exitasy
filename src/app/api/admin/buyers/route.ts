import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/buyers - Get all buyer applications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all buyers (PENDING, APPROVED, REJECTED)
    const buyers = await prisma.user.findMany({
      where: { role: 'BUYER' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        buyerStatus: true,
        bio: true, // Contains application data
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse application data from bio
    const buyersWithData = buyers.map((buyer) => {
      let applicationData = null;
      if (buyer.bio) {
        try {
          applicationData = JSON.parse(buyer.bio);
        } catch {
          // Bio is not JSON
        }
      }

      return {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        image: buyer.image,
        buyerStatus: buyer.buyerStatus,
        createdAt: buyer.createdAt,
        applicationData,
      };
    });

    return NextResponse.json({
      buyers: buyersWithData,
      counts: {
        pending: buyersWithData.filter((b) => b.buyerStatus === 'PENDING').length,
        approved: buyersWithData.filter((b) => b.buyerStatus === 'APPROVED').length,
        rejected: buyersWithData.filter((b) => b.buyerStatus === 'REJECTED').length,
      },
    });
  } catch (error) {
    console.error('Error fetching buyer applications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST /api/admin/buyers - Approve or reject a buyer application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get the buyer
    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, buyerStatus: true, email: true },
    });

    if (!buyer) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (buyer.role !== 'BUYER') {
      return NextResponse.json(
        { message: 'User is not a buyer' },
        { status: 400 }
      );
    }

    // Update buyer status
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { buyerStatus: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        buyerStatus: true,
      },
    });

    // Log the event
    await prisma.eventLog.create({
      data: {
        type: action === 'approve' ? 'BUYER_APPLICATION_APPROVED' : 'BUYER_APPLICATION_REJECTED',
        userId: userId,
        metadata: JSON.stringify({
          adminId: session.user.id,
          previousStatus: buyer.buyerStatus,
          newStatus,
        }),
      },
    });

    // TODO: Send email notification to buyer
    // await sendEmail(buyer.email, action === 'approve' ? 'buyer-approved' : 'buyer-rejected');

    return NextResponse.json({
      success: true,
      message: `Buyer ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error processing buyer action:', error);
    return NextResponse.json(
      { message: 'Failed to process action' },
      { status: 500 }
    );
  }
}
