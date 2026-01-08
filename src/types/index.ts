// ============================================
// Exitasy Data Models
// ============================================

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  website?: string;
  twitter?: string;
  location?: string;
  badges: Badge[];
  guessAccuracy: number;
  guessRank: number;
  totalMRR: number;
  createdAt: Date;
}

export type BadgeType =
  | 'maker'
  | 'verified_seller'
  | 'top_guesser'
  | 'revenue_100k'
  | 'sold_startup'
  | 'early_adopter';

export interface Badge {
  type: BadgeType;
  earnedAt: Date;
}

// Stage Types
export type StartupStage =
  | 'making_money'
  | 'exit_ready'
  | 'acquisition_interest'
  | 'for_sale'
  | 'sold';

export const STAGE_CONFIG: Record<StartupStage, { label: string; color: string; emoji: string }> = {
  making_money: { label: 'Making Money', color: 'bg-green-500', emoji: '🟢' },
  exit_ready: { label: 'Exit-Ready', color: 'bg-yellow-500', emoji: '🟡' },
  acquisition_interest: { label: 'Acquisition Interest', color: 'bg-orange-500', emoji: '🟠' },
  for_sale: { label: 'For Sale', color: 'bg-blue-500', emoji: '🔵' },
  sold: { label: 'Sold', color: 'bg-purple-500', emoji: '🟣' },
};

// Verification Types
export type VerificationProvider = 'stripe' | 'paddle' | 'lemon_squeezy' | 'manual';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Verification {
  status: VerificationStatus;
  provider: VerificationProvider;
  lastSyncedAt: Date;
  proofUrl?: string;
}

// Revenue Types
export interface RevenueSnapshot {
  id: string;
  startupId: string;
  mrr: number;
  revenue30d: number;
  growthMoM: number;
  recordedAt: Date;
}

// Sale Details
export interface SaleDetails {
  askingPrice: number;
  multiple: number;
  includes: string[];
  reason?: string;
}

// Startup Types
export interface Startup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string;
  website: string;
  screenshots: string[];
  videoUrl?: string;

  // Revenue
  verification: Verification;
  currentMRR: number;
  growthMoM: number;
  revenueAge: number; // months

  // Stage
  stage: StartupStage;
  saleDetails?: SaleDetails;
  sellabilityReasons: string[];

  // Engagement
  upvotes: number;
  commentCount: number;
  guessCount: number;
  buyerInterestCount: number;

  // Meta
  categories: string[];
  makers: User[];
  launchDate: Date;
  createdAt: Date;

  // Ranking
  todayRank?: number;
}

// Comment Types
export interface Comment {
  id: string;
  userId: string;
  user: User;
  startupId: string;
  parentId?: string;
  content: string;
  upvotes: number;
  replies?: Comment[];
  createdAt: Date;
}

// Guess Types
export type GuessRange =
  | '$0-1K'
  | '$1K-5K'
  | '$5K-10K'
  | '$10K-20K'
  | '$20K-50K'
  | '$50K+';

export interface Guess {
  id: string;
  userId: string;
  startupId: string;
  range: GuessRange;
  isCorrect?: boolean;
  createdAt: Date;
}

export interface GuessResult {
  range: GuessRange;
  count: number;
  percentage: number;
}

// Buyer Interest
export interface BuyerInterest {
  id: string;
  userId: string;
  startupId: string;
  isAnonymous: boolean;
  message?: string;
  createdAt: Date;
}

// Forum Types
export type ForumCategory =
  | 'revenue_growth'
  | 'exit_strategy'
  | 'acquisition'
  | 'show_tell'
  | 'ama';

export const FORUM_CATEGORIES: Record<ForumCategory, { label: string; emoji: string }> = {
  revenue_growth: { label: 'Revenue Growth', emoji: '📈' },
  exit_strategy: { label: 'Exit Strategy', emoji: '🚪' },
  acquisition: { label: 'Acquisition', emoji: '🤝' },
  show_tell: { label: 'Show & Tell', emoji: '🎪' },
  ama: { label: 'AMA', emoji: '❓' },
};

export interface ForumThread {
  id: string;
  userId: string;
  user: User;
  title: string;
  content: string;
  category: ForumCategory;
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  createdAt: Date;
}

// Feed Types
export type FeedFilter = 'all' | StartupStage;
export type FeedSort = 'trending' | 'new' | 'top_mrr' | 'top_growth';

export interface FeedSection {
  title: string;
  date: Date;
  startups: Startup[];
}

// Leaderboard Types
export interface GuesserRank {
  rank: number;
  user: User;
  accuracy: number;
  totalGuesses: number;
}

export interface StartupRank {
  rank: number;
  startup: Startup;
  upvotes: number;
}
