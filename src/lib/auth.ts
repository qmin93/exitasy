import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import TwitterProvider from 'next-auth/providers/twitter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any) as NextAuthOptions['adapter'],
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    // Twitter OAuth
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || '',
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
      version: '2.0',
    }),
    // Email/Password (for demo)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('User not found');
        }

        // Verify password with bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          username: user.username ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
    newUser: '/onboarding',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;

        // Fetch role and buyerStatus from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, buyerStatus: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.buyerStatus = dbUser.buyerStatus;
        }
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.username = session.username;
        // Refresh role and buyerStatus on update
        if (token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, buyerStatus: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.buyerStatus = dbUser.buyerStatus;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as 'FOUNDER' | 'BUYER' | 'ADMIN';
        session.user.buyerStatus = token.buyerStatus as 'PENDING' | 'APPROVED' | 'REJECTED' | null;
      }
      return session;
    },
    async signIn({ user, profile }) {
      // Generate username from email if not exists
      if (user && !user.name && profile?.email) {
        const username = profile.email.split('@')[0];
        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Generate username from email
      if (user.email) {
        const baseUsername = user.email.split('@')[0];
        let username = baseUsername;
        let counter = 1;

        // Check for existing username
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
