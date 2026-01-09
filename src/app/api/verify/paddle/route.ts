import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Paddle API base URL
const PADDLE_API_URL = 'https://api.paddle.com';
const PADDLE_SANDBOX_URL = 'https://sandbox-api.paddle.com';

// Use sandbox in development
const getPaddleUrl = () => {
  return process.env.NODE_ENV === 'production' ? PADDLE_API_URL : PADDLE_SANDBOX_URL;
};

// POST /api/verify/paddle - Verify revenue via Paddle API Key
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
        { message: 'Startup ID and API key are required' },
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
      // Get transactions from Paddle for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transactionsRes = await fetch(
        `${getPaddleUrl()}/transactions?status=completed&created_at[gte]=${thirtyDaysAgo.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!transactionsRes.ok) {
        const errorData = await transactionsRes.json().catch(() => ({}));
        console.error('Paddle API error:', errorData);
        return NextResponse.json(
          { message: 'Invalid Paddle API key or API error' },
          { status: 400 }
        );
      }

      const transactionsData = await transactionsRes.json();
      const transactions = transactionsData.data || [];

      // Calculate revenue from last 30 days
      const revenue30d = transactions.reduce((sum: number, txn: { details?: { totals?: { total?: string } } }) => {
        const total = parseFloat(txn.details?.totals?.total || '0');
        return sum + total;
      }, 0);

      // Estimate MRR (revenue from last 30 days / 100 for cents)
      const mrr = Math.round(revenue30d / 100);

      // Get previous 30 days for growth calculation
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const prevTransactionsRes = await fetch(
        `${getPaddleUrl()}/transactions?status=completed&created_at[gte]=${sixtyDaysAgo.toISOString()}&created_at[lt]=${thirtyDaysAgo.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let growthMoM = 0;
      if (prevTransactionsRes.ok) {
        const prevData = await prevTransactionsRes.json();
        const prevTransactions = prevData.data || [];
        const previousRevenue = prevTransactions.reduce((sum: number, txn: { details?: { totals?: { total?: string } } }) => {
          const total = parseFloat(txn.details?.totals?.total || '0');
          return sum + total;
        }, 0);

        if (previousRevenue > 0) {
          growthMoM = ((revenue30d - previousRevenue) / previousRevenue) * 100;
        }
      }

      // Update startup with verified revenue
      const updatedStartup = await prisma.startup.update({
        where: { id: startupId },
        data: {
          verificationStatus: 'VERIFIED',
          verificationProvider: 'PADDLE',
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
    } catch (paddleError) {
      console.error('Paddle API error:', paddleError);
      return NextResponse.json(
        { message: 'Failed to verify Paddle account' },
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
