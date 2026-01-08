import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/startups/[slug]/deal - Get detailed deal data (Buyer-only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: 'Authentication required',
          gatingState: 'NOT_LOGGED_IN'
        },
        { status: 401 }
      );
    }

    // Get user with role and buyerStatus
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        buyerStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check buyer access
    // Access granted if:
    // 1. User is ADMIN
    // 2. User is BUYER with APPROVED status
    const hasAccess =
      user.role === 'ADMIN' ||
      (user.role === 'BUYER' && user.buyerStatus === 'APPROVED');

    // Determine gating state for UI
    let gatingState: 'APPROVED' | 'PENDING' | 'REJECTED' | 'FOUNDER' | 'NOT_BUYER' = 'NOT_BUYER';

    if (hasAccess) {
      gatingState = 'APPROVED';
    } else if (user.role === 'BUYER' && user.buyerStatus === 'PENDING') {
      gatingState = 'PENDING';
    } else if (user.role === 'BUYER' && user.buyerStatus === 'REJECTED') {
      gatingState = 'REJECTED';
    } else if (user.role === 'FOUNDER') {
      gatingState = 'FOUNDER';
    }

    // Get startup basic info to verify it exists and is for sale
    const startup = await prisma.startup.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        stage: true,
        currentMRR: true,
        growthMoM: true,
        revenueAge: true,
        askingPrice: true,
        saleMultiple: true,
        saleIncludes: true,
        saleReason: true,
        targetUsers: true,
        monetizationModel: true,
        founderNote: true,
        verificationStatus: true,
        makers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
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

    // Check if startup is for sale
    if (startup.stage !== 'FOR_SALE') {
      return NextResponse.json(
        {
          message: 'This startup is not currently for sale',
          gatingState: 'NOT_FOR_SALE'
        },
        { status: 400 }
      );
    }

    // If user doesn't have access, return gating state without detailed data
    if (!hasAccess) {
      return NextResponse.json({
        hasAccess: false,
        gatingState,
        publicData: {
          name: startup.name,
          askingPrice: startup.askingPrice,
          saleMultiple: startup.saleMultiple,
          currentMRR: startup.currentMRR,
          growthMoM: startup.growthMoM,
        },
      });
    }

    // User has access - return full deal data
    // Calculate additional metrics
    const monthlyExpenses = Math.round(startup.currentMRR * 0.3);
    const monthlyProfit = startup.currentMRR - monthlyExpenses;
    const profitMargin = Math.round((monthlyProfit / startup.currentMRR) * 100);

    // Estimated unit economics (would be real data in production)
    const customerCount = Math.max(10, Math.round(startup.currentMRR / 50));
    const arpu = Math.round(startup.currentMRR / customerCount);
    const ltv = arpu * 12; // Assuming 12 month average lifetime
    const cac = Math.round(20 + Math.random() * 30);
    const churn = Number((2 + Math.random() * 3).toFixed(1));

    const dealData = {
      hasAccess: true,
      gatingState: 'APPROVED',
      startup: {
        id: startup.id,
        name: startup.name,
        slug: startup.slug,
      },
      dealSummary: {
        askingPrice: startup.askingPrice,
        saleMultiple: startup.saleMultiple,
        currentMRR: startup.currentMRR,
        growthMoM: startup.growthMoM,
        revenueAge: startup.revenueAge,
        saleIncludes: startup.saleIncludes,
        saleReason: startup.saleReason,
        isVerified: startup.verificationStatus === 'VERIFIED',
      },
      financials: {
        last30dRevenue: Math.round(startup.currentMRR * 1.1),
        monthlyExpenses,
        monthlyProfit,
        profitMargin,
        arr: startup.currentMRR * 12,
      },
      unitEconomics: {
        customerCount,
        arpu,
        ltv,
        cac,
        ltvCacRatio: Number((ltv / cac).toFixed(1)),
        churnRate: churn,
      },
      operations: {
        teamSize: startup.makers.length,
        targetUsers: startup.targetUsers,
        monetizationModel: startup.monetizationModel,
        founderNote: startup.founderNote,
      },
      founder: startup.makers[0]?.user ? {
        id: startup.makers[0].user.id,
        name: startup.makers[0].user.name,
        username: startup.makers[0].user.username,
        // Only expose email to approved buyers
        email: startup.makers[0].user.email,
      } : null,
      risks: [
        `Market competition may increase in the ${startup.name} space`,
        'Revenue concentration - verify customer diversification',
        'Technical debt review recommended before acquisition',
        startup.growthMoM < 5 ? 'Growth has slowed - investigate causes' : null,
      ].filter(Boolean),
    };

    return NextResponse.json(dealData);
  } catch (error) {
    console.error('Error fetching deal data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch deal data' },
      { status: 500 }
    );
  }
}
