import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This endpoint should be called by Vercel Cron every hour
// cron: 0 * * * * (every hour)
export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all verified startups
    const startups = await prisma.startup.findMany({
      where: { verificationStatus: 'VERIFIED' },
      include: {
        upvotes: {
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { id: true },
        },
        comments: {
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { id: true },
        },
        guesses: {
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { id: true },
        },
      },
    });

    // Calculate and upsert trend scores
    const updates = await Promise.all(
      startups.map(async (startup) => {
        const upvotes7d = startup.upvotes.length;
        const comments7d = startup.comments.length;
        const guesses7d = startup.guesses.length;

        // Recency decay
        const launchDate = startup.launchDate || startup.createdAt;
        const hoursAgo = (now.getTime() - launchDate.getTime()) / (1000 * 60 * 60);
        const recencyBonus = Math.max(0, 1 - (hoursAgo / 168)) * 10;

        // Trend score formula
        const score = (upvotes7d * 2) + (comments7d * 3) + (guesses7d * 1) + recencyBonus;

        return prisma.trendScore.upsert({
          where: { startupId: startup.id },
          create: {
            startupId: startup.id,
            score,
            upvotes7d,
            comments7d,
            guesses7d,
            recencyBonus,
            calculatedAt: now,
          },
          update: {
            score,
            upvotes7d,
            comments7d,
            guesses7d,
            recencyBonus,
            calculatedAt: now,
          },
        });
      })
    );

    return NextResponse.json({
      message: 'Trend scores updated',
      updated: updates.length,
      calculatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error updating trends:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
