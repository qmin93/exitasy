import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json(
        { available: false, message: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check if username is reserved
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
      return NextResponse.json({ available: false });
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    return NextResponse.json({ available: !existingUser });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { available: false, message: 'Error checking username' },
      { status: 500 }
    );
  }
}
