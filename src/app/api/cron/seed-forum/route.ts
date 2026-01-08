import { NextResponse } from 'next/server';

// This endpoint should be called by Vercel Cron every day at 9 AM
// cron: 0 9 * * * (every day at 9 AM)
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

    // Call the forum seed API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/forum/seed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json({
      message: 'Forum seed cron executed',
      result: data,
    });
  } catch (error) {
    console.error('Error in forum seed cron:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
