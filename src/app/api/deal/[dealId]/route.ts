import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/deal/[dealId] - Get deal room details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;

    const dealRoom = await prisma.dealRoom.findUnique({
      where: { id: dealId },
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
            verificationStatus: true,
          },
        },
        introRequest: {
          select: {
            id: true,
            companyName: true,
            budgetRange: true,
            timeline: true,
            buyerType: true,
            message: true,
            createdAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!dealRoom) {
      return NextResponse.json({ message: 'Deal room not found' }, { status: 404 });
    }

    // Check if user is participant (buyer or founder)
    const isParticipant =
      dealRoom.buyerId === session.user.id ||
      dealRoom.founderId === session.user.id;

    if (!isParticipant) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get participant details
    const [buyer, founder] = await Promise.all([
      prisma.user.findUnique({
        where: { id: dealRoom.buyerId },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          email: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: dealRoom.founderId },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          email: true,
        },
      }),
    ]);

    // Determine user's role in this deal
    const userRole = dealRoom.buyerId === session.user.id ? 'buyer' : 'founder';

    // Mark unread messages as read
    await prisma.dealMessage.updateMany({
      where: {
        dealRoomId: dealId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      ...dealRoom,
      buyer,
      founder,
      userRole,
      currentUserId: session.user.id,
    });
  } catch (error) {
    console.error('Error fetching deal room:', error);
    return NextResponse.json(
      { message: 'Failed to fetch deal room' },
      { status: 500 }
    );
  }
}

// POST /api/deal/[dealId] - Send message in deal room
export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: 'Message content required' },
        { status: 400 }
      );
    }

    // Get deal room and verify participation
    const dealRoom = await prisma.dealRoom.findUnique({
      where: { id: dealId },
      include: {
        startup: { select: { name: true } },
      },
    });

    if (!dealRoom) {
      return NextResponse.json({ message: 'Deal room not found' }, { status: 404 });
    }

    const isParticipant =
      dealRoom.buyerId === session.user.id ||
      dealRoom.founderId === session.user.id;

    if (!isParticipant) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (dealRoom.status !== 'OPEN') {
      return NextResponse.json(
        { message: 'Deal room is closed' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.dealMessage.create({
      data: {
        dealRoomId: dealId,
        senderId: session.user.id,
        content: content.trim(),
      },
    });

    // Update last activity
    await prisma.dealRoom.update({
      where: { id: dealId },
      data: { lastActivity: new Date() },
    });

    // Notify the other party
    const recipientId =
      session.user.id === dealRoom.buyerId
        ? dealRoom.founderId
        : dealRoom.buyerId;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'SYSTEM',
        title: 'New message in Deal Room',
        message: `You have a new message about ${dealRoom.startup.name}`,
        link: `/deal/${dealId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PATCH /api/deal/[dealId] - Update deal room (close, share contact, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;
    const body = await req.json();
    const { action, email, phone, closeReason } = body;

    const dealRoom = await prisma.dealRoom.findUnique({
      where: { id: dealId },
    });

    if (!dealRoom) {
      return NextResponse.json({ message: 'Deal room not found' }, { status: 404 });
    }

    const isParticipant =
      dealRoom.buyerId === session.user.id ||
      dealRoom.founderId === session.user.id;

    if (!isParticipant) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const isBuyer = session.user.id === dealRoom.buyerId;

    if (action === 'share_contact') {
      // Share contact info
      const updateData = isBuyer
        ? { buyerEmail: email, buyerPhone: phone }
        : { founderEmail: email, founderPhone: phone };

      const updated = await prisma.dealRoom.update({
        where: { id: dealId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        dealRoom: updated,
      });
    }

    if (action === 'close') {
      // Close the deal room
      const updated = await prisma.dealRoom.update({
        where: { id: dealId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closeReason: closeReason || null,
        },
      });

      return NextResponse.json({
        success: true,
        dealRoom: updated,
      });
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating deal room:', error);
    return NextResponse.json(
      { message: 'Failed to update deal room' },
      { status: 500 }
    );
  }
}
