import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Only initialize Stripe if the key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /api/verify/stripe - Verify revenue via Stripe
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { startupId, stripeAccountId } = await req.json();

    if (!startupId || !stripeAccountId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get startup
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
      include: {
        makers: true,
      },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Verify user is a maker
    const isMaker = startup.makers.some(
      (maker: { userId: string }) => maker.userId === session.user.id
    );

    if (!isMaker) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    try {
      if (!stripe) {
        return NextResponse.json(
          { message: 'Stripe is not configured' },
          { status: 503 }
        );
      }

      // Get Stripe balance transactions for the last 30 days
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

      const balanceTransactions = await stripe.balanceTransactions.list(
        {
          created: { gte: thirtyDaysAgo },
          limit: 100,
          type: 'charge',
        },
        { stripeAccount: stripeAccountId }
      );

      // Calculate revenue
      const revenue30d = balanceTransactions.data.reduce(
        (sum, txn) => sum + txn.amount,
        0
      );

      // Estimate MRR (simplified: last 30 days revenue)
      const mrr = Math.round(revenue30d / 100); // Convert from cents

      // Get previous month's revenue for growth calculation
      const sixtyDaysAgo = thirtyDaysAgo - 30 * 24 * 60 * 60;
      const previousTransactions = await stripe.balanceTransactions.list(
        {
          created: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          limit: 100,
          type: 'charge',
        },
        { stripeAccount: stripeAccountId }
      );

      const previousRevenue = previousTransactions.data.reduce(
        (sum, txn) => sum + txn.amount,
        0
      );

      // Calculate MoM growth
      let growthMoM = 0;
      if (previousRevenue > 0) {
        growthMoM = ((revenue30d - previousRevenue) / previousRevenue) * 100;
      }

      // Update startup with verified revenue
      const updatedStartup = await prisma.startup.update({
        where: { id: startupId },
        data: {
          verificationStatus: 'VERIFIED',
          verificationProvider: 'STRIPE',
          lastVerifiedAt: new Date(),
          currentMRR: mrr,
          growthMoM: Math.round(growthMoM * 10) / 10,
        },
      });

      // Create revenue snapshot
      await prisma.revenueSnapshot.create({
        data: {
          startupId,
          mrr,
          revenue30d: Math.round(revenue30d / 100),
          growthMoM: Math.round(growthMoM * 10) / 10,
        },
      });

      return NextResponse.json({
        verified: true,
        mrr,
        revenue30d: Math.round(revenue30d / 100),
        growthMoM: Math.round(growthMoM * 10) / 10,
        startup: updatedStartup,
      });
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      return NextResponse.json(
        { message: 'Failed to verify Stripe account' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying revenue:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/verify/stripe/connect - Get Stripe Connect URL
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get('startupId');

    if (!startupId) {
      return NextResponse.json(
        { message: 'Startup ID is required' },
        { status: 400 }
      );
    }

    // Create Stripe OAuth link
    const state = Buffer.from(
      JSON.stringify({ userId: session.user.id, startupId })
    ).toString('base64');

    const authUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CLIENT_ID}&scope=read_only&state=${state}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating Stripe connect URL:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
