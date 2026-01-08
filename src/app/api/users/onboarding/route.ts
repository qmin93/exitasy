import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/users/onboarding - Complete onboarding
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { username, bio, website, twitter, location } = await req.json();

    // Validate username
    if (!username || username.length < 3) {
      return NextResponse.json(
        { message: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check reserved usernames
    const reservedUsernames = [
      'admin',
      'api',
      'www',
      'mail',
      'support',
      'help',
      'info',
      'exitasy',
      'startup',
      'user',
      'settings',
      'login',
      'register',
      'logout',
      'profile',
    ];

    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json(
        { message: 'This username is reserved' },
        { status: 400 }
      );
    }

    // Check if username is taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 409 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username: username.toLowerCase(),
        bio: bio || null,
        website: website || null,
        twitter: twitter || null,
        location: location || null,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      message: 'Onboarding completed',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        bio: updatedUser.bio,
        website: updatedUser.website,
        twitter: updatedUser.twitter,
        location: updatedUser.location,
      },
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
