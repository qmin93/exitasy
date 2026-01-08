import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Valid guess ranges (stored as String in SQLite)
const VALID_GUESS_RANGES = [
  'RANGE_0_1K',
  'RANGE_1K_5K',
  'RANGE_5K_10K',
  'RANGE_10K_20K',
  'RANGE_20K_50K',
  'RANGE_50K_PLUS',
] as const;

type GuessRangeType = typeof VALID_GUESS_RANGES[number];

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// Helper to check if guess is correct based on actual MRR
function checkGuessCorrect(range: string, actualMRR: number): boolean {
  switch (range) {
    case 'RANGE_0_1K':
      return actualMRR >= 0 && actualMRR < 1000;
    case 'RANGE_1K_5K':
      return actualMRR >= 1000 && actualMRR < 5000;
    case 'RANGE_5K_10K':
      return actualMRR >= 5000 && actualMRR < 10000;
    case 'RANGE_10K_20K':
      return actualMRR >= 10000 && actualMRR < 20000;
    case 'RANGE_20K_50K':
      return actualMRR >= 20000 && actualMRR < 50000;
    case 'RANGE_50K_PLUS':
      return actualMRR >= 50000;
    default:
      return false;
  }
}

// POST /api/startups/[slug]/guess - Submit a guess
export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { range } = await req.json();

    if (!range || !VALID_GUESS_RANGES.includes(range as GuessRangeType)) {
      return NextResponse.json(
        { message: 'Invalid guess range' },
        { status: 400 }
      );
    }

    const startup = await prisma.startup.findUnique({
      where: { slug },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Check if user already guessed
    const existingGuess = await prisma.guess.findUnique({
      where: {
        userId_startupId: {
          userId: session.user.id,
          startupId: startup.id,
        },
      },
    });

    if (existingGuess) {
      return NextResponse.json(
        { message: 'You already guessed for this startup' },
        { status: 409 }
      );
    }

    // Check if correct
    const isCorrect = checkGuessCorrect(range, startup.currentMRR);

    // Create guess
    const guess = await prisma.guess.create({
      data: {
        userId: session.user.id,
        startupId: startup.id,
        range,
        isCorrect,
      },
    });

    // Update startup guess count
    await prisma.startup.update({
      where: { id: startup.id },
      data: { guessCount: { increment: 1 } },
    });

    // Update user accuracy if guess was evaluated
    if (isCorrect !== null) {
      const userGuesses = await prisma.guess.findMany({
        where: {
          userId: session.user.id,
          isCorrect: { not: null },
        },
      });

      const correctCount = userGuesses.filter((g) => g.isCorrect).length;
      const accuracy = (correctCount / userGuesses.length) * 100;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { guessAccuracy: accuracy },
      });
    }

    return NextResponse.json({
      guess,
      isCorrect,
      actualMRR: startup.currentMRR,
    });
  } catch (error) {
    console.error('Error submitting guess:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/startups/[slug]/guess - Get guess stats
export async function GET(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { slug } = await context.params;

    const startup = await prisma.startup.findUnique({
      where: { slug },
    });

    if (!startup) {
      return NextResponse.json(
        { message: 'Startup not found' },
        { status: 404 }
      );
    }

    // Get all guesses for distribution
    const guesses = await prisma.guess.findMany({
      where: { startupId: startup.id },
    });

    // Calculate distribution
    const distribution: Record<string, number> = {
      RANGE_0_1K: 0,
      RANGE_1K_5K: 0,
      RANGE_5K_10K: 0,
      RANGE_10K_20K: 0,
      RANGE_20K_50K: 0,
      RANGE_50K_PLUS: 0,
    };

    guesses.forEach((guess) => {
      distribution[guess.range]++;
    });

    // Check if current user guessed
    let userGuess = null;
    if (session?.user?.id) {
      userGuess = await prisma.guess.findUnique({
        where: {
          userId_startupId: {
            userId: session.user.id,
            startupId: startup.id,
          },
        },
      });
    }

    return NextResponse.json({
      totalGuesses: guesses.length,
      distribution,
      userGuess,
    });
  } catch (error) {
    console.error('Error fetching guess stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
