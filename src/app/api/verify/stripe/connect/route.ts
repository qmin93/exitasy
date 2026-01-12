import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/verify/stripe/connect - Start Stripe OAuth flow
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Stripe Client ID is configured
    const stripeClientId = process.env.STRIPE_CLIENT_ID;
    if (!stripeClientId) {
      return NextResponse.json(
        { message: 'Stripe Connect is not configured' },
        { status: 500 }
      );
    }

    const { startupId } = await req.json();

    // If no startupId, create a draft startup
    let targetStartupId = startupId;

    if (!targetStartupId) {
      // Create draft startup for verification
      const draftStartup = await prisma.startup.create({
        data: {
          name: 'Draft Startup',
          slug: `draft-${session.user.id}-${Date.now()}`,
          tagline: 'Draft for verification',
          description: 'Draft startup for Stripe verification',
          website: 'https://example.com',
          categories: JSON.stringify(['SaaS']),
          stage: 'MAKING_MONEY',
          makers: {
            create: {
              userId: session.user.id,
              role: 'FOUNDER',
            },
          },
        },
      });
      targetStartupId = draftStartup.id;
    }

    // Create state parameter with startup info
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        startupId: targetStartupId,
      })
    ).toString('base64');

    // Build OAuth URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/verify/stripe/callback`;

    const oauthUrl = new URL('https://connect.stripe.com/oauth/authorize');
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('client_id', stripeClientId);
    oauthUrl.searchParams.set('scope', 'read_only');
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('state', state);

    return NextResponse.json({
      url: oauthUrl.toString(),
      startupId: targetStartupId,
    });
  } catch (error) {
    console.error('Error starting Stripe OAuth:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
