import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Only initialize Stripe if the key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// GET /api/verify/stripe/callback - Handle Stripe OAuth callback
export async function GET(req: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.redirect(
        new URL('/submit?error=stripe_not_configured', req.url)
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Stripe OAuth error:', error);
      return NextResponse.redirect(
        new URL('/submit?error=stripe_auth_failed', req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/submit?error=missing_params', req.url)
      );
    }

    // Decode state
    let stateData: { userId: string; startupId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/submit?error=invalid_state', req.url)
      );
    }

    // Exchange code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeUserId = response.stripe_user_id;

    if (!stripeUserId) {
      return NextResponse.redirect(
        new URL('/submit?error=no_stripe_user', req.url)
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
      { stripeAccount: stripeUserId }
    );

    // Calculate revenue
    const revenue30d = balanceTransactions.data.reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    // Estimate MRR
    const mrr = Math.round(revenue30d / 100);

    // Get previous month's revenue
    const sixtyDaysAgo = thirtyDaysAgo - 30 * 24 * 60 * 60;
    const previousTransactions = await stripe.balanceTransactions.list(
      {
        created: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        limit: 100,
        type: 'charge',
      },
      { stripeAccount: stripeUserId }
    );

    const previousRevenue = previousTransactions.data.reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    // Calculate growth
    let growthMoM = 0;
    if (previousRevenue > 0) {
      growthMoM = ((revenue30d - previousRevenue) / previousRevenue) * 100;
    }

    // Update startup
    await prisma.startup.update({
      where: { id: stateData.startupId },
      data: {
        verificationStatus: 'VERIFIED',
        verificationProvider: 'STRIPE',
        verificationProofUrl: `stripe:${stripeUserId}`,
        lastVerifiedAt: new Date(),
        currentMRR: mrr,
        growthMoM: Math.round(growthMoM * 10) / 10,
      },
    });

    // Create revenue snapshot
    await prisma.revenueSnapshot.create({
      data: {
        startupId: stateData.startupId,
        mrr,
        revenue30d: Math.round(revenue30d / 100),
        growthMoM: Math.round(growthMoM * 10) / 10,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/submit?success=verified&mrr=${mrr}&growth=${Math.round(growthMoM * 10) / 10}`,
        req.url
      )
    );
  } catch (error) {
    console.error('Stripe callback error:', error);
    return NextResponse.redirect(
      new URL('/submit?error=verification_failed', req.url)
    );
  }
}
