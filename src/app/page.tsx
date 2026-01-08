import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StartupFeed } from '@/components/feed/StartupFeed';
import { Hero } from '@/components/feed/Hero';
import { JustVerifiedBanner } from '@/components/feed/JustVerifiedBanner';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <JustVerifiedBanner />
      <Hero />

      <main className="w-full px-4 py-8">
        <div className="flex gap-8 justify-center items-start mx-auto" style={{ maxWidth: '1100px' }}>
          {/* Main Feed */}
          <div className="w-full" style={{ maxWidth: '680px' }}>
            <StartupFeed />
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
