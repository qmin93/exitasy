import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Exitasy - The community where SaaS founders flex real revenue',
  description:
    'Discover verified SaaS products, track real revenue, guess MRR, and connect with indie hackers. No ideas. No promises. Just verified money makers.',
  keywords: [
    'SaaS',
    'startup',
    'indie hacker',
    'MRR',
    'revenue',
    'acquisition',
    'exit',
  ],
  openGraph: {
    title: 'Exitasy - Verified SaaS Revenue Database',
    description:
      'The community where SaaS founders flex real revenue. Discover, upvote, and guess the MRR of verified startups.',
    type: 'website',
    url: 'https://exitasy.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Exitasy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exitasy - Verified SaaS Revenue Database',
    description: 'The community where SaaS founders flex real revenue.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
