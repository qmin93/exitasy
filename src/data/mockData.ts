import {
  User,
  Startup,
  Comment,
  ForumThread,
  GuesserRank,
  GuessResult,
} from '@/types';

// ============================================
// Mock Users
// ============================================
export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'nocode_sam',
    email: 'sam@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
    bio: 'Indie hacker building no-code tools. 2x founder. $50K+ total MRR.',
    website: 'https://nocodesam.com',
    twitter: '@nocodesam',
    location: 'Austin, TX',
    badges: [
      { type: 'maker', earnedAt: new Date('2024-01-15') },
      { type: 'verified_seller', earnedAt: new Date('2024-06-01') },
    ],
    guessAccuracy: 78,
    guessRank: 42,
    totalMRR: 68000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    username: 'indie_dan',
    email: 'dan@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dan',
    bio: 'Building in public. Bootstrapped to $10K MRR.',
    website: 'https://indiedan.dev',
    twitter: '@indie_dan',
    location: 'San Francisco, CA',
    badges: [
      { type: 'maker', earnedAt: new Date('2024-03-10') },
      { type: 'top_guesser', earnedAt: new Date('2024-11-01') },
    ],
    guessAccuracy: 94,
    guessRank: 1,
    totalMRR: 12000,
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'user-3',
    username: 'saas_sara',
    email: 'sara@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara',
    bio: 'SaaS enthusiast. Love analyzing startup metrics.',
    twitter: '@saas_sara',
    location: 'New York, NY',
    badges: [
      { type: 'top_guesser', earnedAt: new Date('2024-10-15') },
    ],
    guessAccuracy: 89,
    guessRank: 2,
    totalMRR: 0,
    createdAt: new Date('2024-05-01'),
  },
  {
    id: 'user-4',
    username: 'maker_mike',
    email: 'mike@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    bio: 'Serial entrepreneur. 3 exits under my belt.',
    website: 'https://makermike.io',
    twitter: '@maker_mike',
    location: 'Miami, FL',
    badges: [
      { type: 'maker', earnedAt: new Date('2023-06-01') },
      { type: 'sold_startup', earnedAt: new Date('2024-08-01') },
      { type: 'revenue_100k', earnedAt: new Date('2024-02-01') },
    ],
    guessAccuracy: 87,
    guessRank: 3,
    totalMRR: 145000,
    createdAt: new Date('2023-06-01'),
  },
];

// ============================================
// Mock Startups
// ============================================
export const mockStartups: Startup[] = [
  {
    id: 'startup-1',
    name: 'FormFlow',
    slug: 'formflow',
    tagline: 'No-code form builder for indie hackers',
    description:
      'FormFlow lets you create beautiful, conversion-optimized forms without writing any code. Perfect for indie hackers who want to collect leads, payments, and feedback without the complexity of traditional tools.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=formflow',
    website: 'https://formflow.app',
    screenshots: [
      '/screenshots/formflow-1.png',
      '/screenshots/formflow-2.png',
      '/screenshots/formflow-3.png',
    ],
    verification: {
      status: 'verified',
      provider: 'stripe',
      lastSyncedAt: new Date('2026-01-05'),
    },
    currentMRR: 18000,
    growthMoM: 8,
    revenueAge: 14,
    stage: 'exit_ready',
    saleDetails: {
      askingPrice: 50000,
      multiple: 2.8,
      includes: ['Source Code', 'Domain', 'Customer Base', 'Social Accounts'],
      reason: 'Moving on to a new project',
    },
    sellabilityReasons: [
      '500+ paying customers, 2% monthly churn',
      'Zero dependencies on founder (fully automated)',
      'Growing market: no-code tools +40% YoY',
    ],
    upvotes: 89,
    commentCount: 34,
    guessCount: 127,
    buyerInterestCount: 12,
    categories: ['NoCode', 'Forms', 'Productivity'],
    makers: [mockUsers[0]],
    launchDate: new Date('2026-01-07'),
    createdAt: new Date('2024-11-01'),
    todayRank: 2,
  },
  {
    id: 'startup-2',
    name: 'StatPecker',
    slug: 'statpecker',
    tagline: 'Analytics dashboard for solo founders',
    description:
      'Simple, beautiful analytics for indie hackers. Track your key metrics without the complexity of Google Analytics.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=statpecker',
    website: 'https://statpecker.com',
    screenshots: ['/screenshots/statpecker-1.png'],
    verification: {
      status: 'verified',
      provider: 'stripe',
      lastSyncedAt: new Date('2026-01-06'),
    },
    currentMRR: 2300,
    growthMoM: 15,
    revenueAge: 8,
    stage: 'making_money',
    sellabilityReasons: [],
    upvotes: 47,
    commentCount: 12,
    guessCount: 89,
    buyerInterestCount: 0,
    categories: ['Analytics', 'SaaS', 'Indie'],
    makers: [mockUsers[1]],
    launchDate: new Date('2026-01-07'),
    createdAt: new Date('2025-05-01'),
    todayRank: 3,
  },
  {
    id: 'startup-3',
    name: 'InvoiceNinja',
    slug: 'invoiceninja',
    tagline: 'Beautiful invoicing for freelancers',
    description:
      'Create and send professional invoices in seconds. Get paid faster with automatic reminders.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=invoiceninja',
    website: 'https://invoiceninja.io',
    screenshots: ['/screenshots/invoiceninja-1.png'],
    verification: {
      status: 'verified',
      provider: 'paddle',
      lastSyncedAt: new Date('2026-01-04'),
    },
    currentMRR: 5200,
    growthMoM: 12,
    revenueAge: 18,
    stage: 'making_money',
    sellabilityReasons: [],
    upvotes: 156,
    commentCount: 67,
    guessCount: 203,
    buyerInterestCount: 3,
    categories: ['Finance', 'Freelance', 'SaaS'],
    makers: [mockUsers[3]],
    launchDate: new Date('2026-01-06'),
    createdAt: new Date('2024-07-01'),
  },
  {
    id: 'startup-4',
    name: 'APIMonitor',
    slug: 'apimonitor',
    tagline: 'Uptime monitoring for your APIs',
    description:
      'Get instant alerts when your API goes down. Simple setup, powerful features.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=apimonitor',
    website: 'https://apimonitor.dev',
    screenshots: ['/screenshots/apimonitor-1.png'],
    verification: {
      status: 'verified',
      provider: 'stripe',
      lastSyncedAt: new Date('2026-01-07'),
    },
    currentMRR: 1800,
    growthMoM: 22,
    revenueAge: 6,
    stage: 'making_money',
    sellabilityReasons: [],
    upvotes: 31,
    commentCount: 8,
    guessCount: 45,
    buyerInterestCount: 0,
    categories: ['DevTools', 'Monitoring', 'API'],
    makers: [mockUsers[1]],
    launchDate: new Date('2026-01-07'),
    createdAt: new Date('2025-07-01'),
    todayRank: 4,
  },
  {
    id: 'startup-5',
    name: 'ChatWidget',
    slug: 'chatwidget',
    tagline: 'Live chat widget for any website',
    description:
      'Add live chat to your website in 5 minutes. No coding required.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=chatwidget',
    website: 'https://chatwidget.io',
    screenshots: ['/screenshots/chatwidget-1.png'],
    verification: {
      status: 'verified',
      provider: 'manual',
      lastSyncedAt: new Date('2026-01-05'),
    },
    currentMRR: 1200,
    growthMoM: 31,
    revenueAge: 4,
    stage: 'making_money',
    sellabilityReasons: [],
    upvotes: 98,
    commentCount: 23,
    guessCount: 67,
    buyerInterestCount: 2,
    categories: ['Chat', 'Widget', 'SaaS'],
    makers: [mockUsers[0]],
    launchDate: new Date('2026-01-06'),
    createdAt: new Date('2025-09-01'),
  },
  {
    id: 'startup-6',
    name: 'QuickPDF',
    slug: 'quickpdf',
    tagline: 'PDF generation API for developers',
    description:
      'Generate PDFs from HTML templates with a simple API call. Perfect for invoices, reports, and more.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=quickpdf',
    website: 'https://quickpdf.dev',
    screenshots: ['/screenshots/quickpdf-1.png'],
    verification: {
      status: 'verified',
      provider: 'stripe',
      lastSyncedAt: new Date('2025-12-01'),
    },
    currentMRR: 0,
    growthMoM: 0,
    revenueAge: 24,
    stage: 'sold',
    saleDetails: {
      askingPrice: 120000,
      multiple: 3.2,
      includes: ['Source Code', 'Domain', 'Customer Base'],
    },
    sellabilityReasons: [
      'Stable revenue for 2 years',
      'Strong developer documentation',
      'Low churn rate (1.5%)',
    ],
    upvotes: 234,
    commentCount: 89,
    guessCount: 312,
    buyerInterestCount: 28,
    categories: ['API', 'DevTools', 'PDF'],
    makers: [mockUsers[0]],
    launchDate: new Date('2024-06-15'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'startup-7',
    name: 'TaskBoard',
    slug: 'taskboard',
    tagline: 'Kanban for solopreneurs',
    description:
      'Simple task management designed for indie hackers. No bloat, just productivity.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=taskboard',
    website: 'https://taskboard.app',
    screenshots: ['/screenshots/taskboard-1.png'],
    verification: {
      status: 'verified',
      provider: 'stripe',
      lastSyncedAt: new Date('2026-01-06'),
    },
    currentMRR: 2300,
    growthMoM: 15,
    revenueAge: 10,
    stage: 'for_sale',
    saleDetails: {
      askingPrice: 80000,
      multiple: 2.9,
      includes: ['Source Code', 'Domain', 'Customer Base', 'Support/Transition'],
      reason: 'Focusing on my primary business',
    },
    sellabilityReasons: [
      '300+ paying users',
      'Minimal support needed',
      'Clean codebase (React + Node)',
    ],
    upvotes: 47,
    commentCount: 12,
    guessCount: 56,
    buyerInterestCount: 5,
    categories: ['Productivity', 'Kanban', 'SaaS'],
    makers: [mockUsers[0]],
    launchDate: new Date('2025-03-01'),
    createdAt: new Date('2025-03-01'),
  },
  {
    id: 'startup-8',
    name: 'EmailPro',
    slug: 'emailpro',
    tagline: 'Email marketing for small teams',
    description:
      'Send beautiful emails without the complexity. Perfect for indie hackers and small teams.',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=emailpro',
    website: 'https://emailpro.io',
    screenshots: ['/screenshots/emailpro-1.png'],
    verification: {
      status: 'verified',
      provider: 'stripe',
      lastSyncedAt: new Date('2026-01-03'),
    },
    currentMRR: 8500,
    growthMoM: 5,
    revenueAge: 20,
    stage: 'acquisition_interest',
    sellabilityReasons: [
      'Received 3 acquisition inquiries',
      'Profitable from day 1',
      '95% customer satisfaction',
    ],
    upvotes: 178,
    commentCount: 45,
    guessCount: 189,
    buyerInterestCount: 15,
    categories: ['Email', 'Marketing', 'SaaS'],
    makers: [mockUsers[3]],
    launchDate: new Date('2024-05-01'),
    createdAt: new Date('2024-05-01'),
  },
];

// ============================================
// Mock Comments
// ============================================
export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    userId: 'user-2',
    user: mockUsers[1],
    startupId: 'startup-1',
    content:
      "Congrats on the launch! 🎉 The UI looks super clean. Question: what's your main acquisition channel?",
    upvotes: 12,
    createdAt: new Date('2026-01-07T10:00:00'),
    replies: [
      {
        id: 'comment-1-1',
        userId: 'user-1',
        user: mockUsers[0],
        startupId: 'startup-1',
        parentId: 'comment-1',
        content:
          'Thanks! Mostly SEO + Twitter. We write a lot of content about no-code form building.',
        upvotes: 8,
        createdAt: new Date('2026-01-07T11:00:00'),
      },
      {
        id: 'comment-1-2',
        userId: 'user-3',
        user: mockUsers[2],
        startupId: 'startup-1',
        parentId: 'comment-1',
        content: 'That makes sense! Your blog posts rank well.',
        upvotes: 3,
        createdAt: new Date('2026-01-07T11:30:00'),
      },
    ],
  },
  {
    id: 'comment-2',
    userId: 'user-3',
    user: mockUsers[2],
    startupId: 'startup-1',
    content:
      "2.8x multiple seems fair for this MRR and growth rate. Have you considered holding longer? The market is growing.",
    upvotes: 24,
    createdAt: new Date('2026-01-07T08:00:00'),
  },
  {
    id: 'comment-3',
    userId: 'user-4',
    user: mockUsers[3],
    startupId: 'startup-1',
    content:
      "Impressive growth! I sold my PDF tool at a similar multiple. Happy to chat about the exit process if you need advice.",
    upvotes: 18,
    createdAt: new Date('2026-01-07T07:00:00'),
  },
];

// ============================================
// Mock Forum Threads
// ============================================
export const mockForumThreads: ForumThread[] = [
  {
    id: 'thread-1',
    userId: 'user-2',
    user: mockUsers[1],
    title: 'How I went from $0 to $10K MRR in 6 months',
    content:
      'I started with a simple landing page and validated the idea before writing any code...',
    category: 'revenue_growth',
    upvotes: 156,
    replyCount: 42,
    isPinned: false,
    createdAt: new Date('2026-01-07T06:00:00'),
  },
  {
    id: 'thread-2',
    userId: 'user-4',
    user: mockUsers[3],
    title: 'Sold my SaaS for 4.2x - AMA',
    content: 'Just closed the deal last week. Ask me anything about the process!',
    category: 'ama',
    upvotes: 234,
    replyCount: 89,
    isPinned: true,
    createdAt: new Date('2026-01-06T12:00:00'),
  },
  {
    id: 'thread-3',
    userId: 'user-3',
    user: mockUsers[2],
    title: "What's a fair multiple for B2B SaaS?",
    content:
      "I'm seeing offers ranging from 2x to 5x. What factors should I consider?",
    category: 'exit_strategy',
    upvotes: 67,
    replyCount: 28,
    isPinned: false,
    createdAt: new Date('2026-01-07T09:00:00'),
  },
];

// ============================================
// Mock Guess Results
// ============================================
export const mockGuessResults: GuessResult[] = [
  { range: '$0-1K', count: 5, percentage: 4 },
  { range: '$1K-5K', count: 12, percentage: 9 },
  { range: '$5K-10K', count: 23, percentage: 18 },
  { range: '$10K-20K', count: 67, percentage: 53 },
  { range: '$20K-50K', count: 15, percentage: 12 },
  { range: '$50K+', count: 5, percentage: 4 },
];

// ============================================
// Mock Guesser Rankings
// ============================================
export const mockGuesserRankings: GuesserRank[] = [
  { rank: 1, user: mockUsers[1], accuracy: 94, totalGuesses: 156 },
  { rank: 2, user: mockUsers[2], accuracy: 89, totalGuesses: 203 },
  { rank: 3, user: mockUsers[3], accuracy: 87, totalGuesses: 98 },
];

// ============================================
// Helper Functions
// ============================================
export function getStartupsByDate(date: 'today' | 'yesterday' | 'week' | 'month'): Startup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return mockStartups.filter((startup) => {
    const launchDate = new Date(startup.launchDate);
    const launchDay = new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate());
    const diffDays = Math.floor((today.getTime() - launchDay.getTime()) / (1000 * 60 * 60 * 24));

    switch (date) {
      case 'today':
        return diffDays === 0;
      case 'yesterday':
        return diffDays === 1;
      case 'week':
        return diffDays >= 2 && diffDays <= 7;
      case 'month':
        return diffDays > 7 && diffDays <= 30;
      default:
        return true;
    }
  });
}

export function getTrendingStartups(limit: number = 5): Startup[] {
  return [...mockStartups]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, limit);
}

export function getForSaleStartups(): Startup[] {
  return mockStartups.filter(
    (s) => s.stage === 'for_sale' || s.stage === 'exit_ready'
  );
}

export function getRecentlyVerified(limit: number = 5): Startup[] {
  return [...mockStartups]
    .filter((s) => s.verification.status === 'verified')
    .sort(
      (a, b) =>
        new Date(b.verification.lastSyncedAt).getTime() -
        new Date(a.verification.lastSyncedAt).getTime()
    )
    .slice(0, limit);
}
