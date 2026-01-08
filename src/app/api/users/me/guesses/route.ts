import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/users/me/guesses - Get current user's guesses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const guesses = await prisma.guess.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            logo: true,
            currentMRR: true,
            verificationStatus: true,
            categories: true,
          },
        },
      },
    });

    // Parse JSON fields and calculate accuracy
    const parsedGuesses = guesses.map((guess) => {
      const actualMRR = guess.startup.currentMRR;
      const guessRange = guess.range;

      // Determine if guess was correct based on range
      let isCorrect = false;
      const rangeMap: Record<string, [number, number]> = {
        'RANGE_0_1K': [0, 1000],
        'RANGE_1K_5K': [1000, 5000],
        'RANGE_5K_10K': [5000, 10000],
        'RANGE_10K_20K': [10000, 20000],
        'RANGE_20K_50K': [20000, 50000],
        'RANGE_50K_PLUS': [50000, Infinity],
      };

      if (rangeMap[guessRange]) {
        const [min, max] = rangeMap[guessRange];
        isCorrect = actualMRR >= min && actualMRR < max;
      }

      return {
        ...guess,
        startup: {
          ...guess.startup,
          categories: JSON.parse(guess.startup.categories || '[]'),
        },
        actualMRR,
        isCorrect,
      };
    });

    // Calculate overall stats
    const totalGuesses = parsedGuesses.length;
    const correctGuesses = parsedGuesses.filter((g) => g.isCorrect).length;
    const accuracy = totalGuesses > 0 ? (correctGuesses / totalGuesses) * 100 : 0;

    return NextResponse.json({
      guesses: parsedGuesses,
      stats: {
        totalGuesses,
        correctGuesses,
        accuracy: accuracy.toFixed(1),
      },
    });
  } catch (error) {
    console.error('Error fetching user guesses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
