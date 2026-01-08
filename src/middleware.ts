import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isOnboardingPage = req.nextUrl.pathname === '/onboarding';
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                       req.nextUrl.pathname.startsWith('/register');
    const isApiRoute = req.nextUrl.pathname.startsWith('/api');
    const isPublicPage = req.nextUrl.pathname === '/' ||
                         req.nextUrl.pathname.startsWith('/startup/');

    // Allow API routes
    if (isApiRoute) {
      return NextResponse.next();
    }

    // Allow auth pages
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Allow public pages
    if (isPublicPage) {
      return NextResponse.next();
    }

    // If user is authenticated but hasn't completed onboarding, redirect to onboarding
    // Skip this check if already on onboarding page
    if (token && !token.username && !isOnboardingPage) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // If user has completed onboarding but tries to access onboarding page, redirect to home
    if (token && token.username && isOnboardingPage) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isOnboardingPage = req.nextUrl.pathname === '/onboarding';
        const isSettingsPage = req.nextUrl.pathname.startsWith('/settings');
        const isSubmitPage = req.nextUrl.pathname === '/submit';

        // Require auth for onboarding, settings, and submit pages
        if (isOnboardingPage || isSettingsPage || isSubmitPage) {
          return !!token;
        }

        // Allow all other pages
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth.js routes)
     * - Static files (*.png, *.jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
