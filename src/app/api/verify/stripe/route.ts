import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// POST /api/verify/stripe - Verify revenue via Stripe API Key
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { startupId, apiKey } = await req.json();

    if (!startupId || !apiKey) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('sk_') && !apiKey.startsWith('rk_')) {
      return NextResponse.json(
        { message: 'Invalid Stripe API key format. Use a Secret Key (sk_) or Restricted Key (rk_).' },
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
      // Initialize Stripe with user's API key
      const userStripe = new Stripe(apiKey);

      // Get Stripe balance transactions for the last 30 days
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

      const balanceTransactions = await userStripe.balanceTransactions.list({
        created: { gte: thirtyDaysAgo },
        limit: 100,
        type: 'charge',
      });

      // Calculate revenue
      const revenue30d = balanceTransactions.data.reduce(
        (sum, txn) => sum + txn.amount,
        0
      );

      // Estimate MRR (simplified: last 30 days revenue)
      const mrr = Math.round(revenue30d / 100); // Convert from cents

      // Get previous month's revenue for growth calculation
      const sixtyDaysAgo = thirtyDaysAgo - 30 * 24 * 60 * 60;
      const previousTransactions = await userStripe.balanceTransactions.list({
        created: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        limit: 100,
        type: 'charge',
      });

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
    } catch (stripeError: unknown) {
      console.error('Stripe API error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Failed to verify Stripe account';
      return NextResponse.json(
        { message: errorMessage },
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
