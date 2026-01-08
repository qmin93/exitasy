import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const db = new Database('dev.db');

async function main() {
  console.log('🌱 Seeding database with better-sqlite3...');

  // Clear existing data (in reverse order due to foreign keys)
  console.log('🗑️ Clearing existing data...');
  db.exec('DELETE FROM StartupMaker');
  db.exec('DELETE FROM Badge');
  db.exec('DELETE FROM Upvote');
  db.exec('DELETE FROM Comment');
  db.exec('DELETE FROM Guess');
  db.exec('DELETE FROM BuyerInterest');
  db.exec('DELETE FROM RevenueSnapshot');
  db.exec('DELETE FROM ForumReply');
  db.exec('DELETE FROM ForumThread');
  db.exec('DELETE FROM Startup');
  db.exec('DELETE FROM Session');
  db.exec('DELETE FROM Account');
  db.exec('DELETE FROM User');

  const hashedPassword = await bcrypt.hash('password123', 12);
  const now = new Date().toISOString();
  const pastDates = [
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),  // 7 days ago
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),  // 3 days ago
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),  // 1 day ago
  ];

  // Create users (10 users)
  const users = [
    {
      id: randomUUID(),
      email: 'alex@example.com',
      name: 'Alex Chen',
      username: 'alexchen',
      password: hashedPassword,
      bio: 'Serial indie hacker. Building profitable SaaS products.',
      website: 'https://alexchen.dev',
      twitter: '@alexchen',
      location: 'San Francisco, CA',
      guessAccuracy: 78,
      guessRank: 12,
      totalMRR: 15000,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'sarah@example.com',
      name: 'Sarah Kim',
      username: 'sarahkim',
      password: hashedPassword,
      bio: 'Solo founder. Bootstrapping to $10K MRR.',
      website: 'https://sarahkim.io',
      twitter: '@sarahkim',
      location: 'Austin, TX',
      guessAccuracy: 85,
      guessRank: 5,
      totalMRR: 8500,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'mike@example.com',
      name: 'Mike Johnson',
      username: 'mikej',
      password: hashedPassword,
      bio: 'Full-stack developer turned entrepreneur.',
      website: null,
      twitter: '@mikej_dev',
      location: 'New York, NY',
      guessAccuracy: 62,
      guessRank: 45,
      totalMRR: 3200,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'emma@example.com',
      name: 'Emma Wilson',
      username: 'emmaw',
      password: hashedPassword,
      bio: 'Product designer building micro-SaaS tools.',
      website: 'https://emmawilson.design',
      twitter: '@emmaw_design',
      location: 'London, UK',
      guessAccuracy: 91,
      guessRank: 2,
      totalMRR: 22000,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'david@example.com',
      name: 'David Park',
      username: 'davidpark',
      password: hashedPassword,
      bio: 'AI enthusiast. Building the future of automation.',
      website: 'https://davidpark.ai',
      twitter: '@davidpark_ai',
      location: 'Seattle, WA',
      guessAccuracy: 73,
      guessRank: 18,
      totalMRR: 45000,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'lisa@example.com',
      name: 'Lisa Wang',
      username: 'lisawang',
      password: hashedPassword,
      bio: 'Former Google engineer. Now building bootstrapped products.',
      website: 'https://lisawang.dev',
      twitter: '@lisawang_dev',
      location: 'Palo Alto, CA',
      guessAccuracy: 88,
      guessRank: 3,
      totalMRR: 67000,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'james@example.com',
      name: 'James Brown',
      username: 'jamesb',
      password: hashedPassword,
      bio: 'Startup advisor and serial founder.',
      website: 'https://jamesbrown.vc',
      twitter: '@jamesb_vc',
      location: 'Boston, MA',
      guessAccuracy: 69,
      guessRank: 28,
      totalMRR: 12000,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'nina@example.com',
      name: 'Nina Patel',
      username: 'ninapatel',
      password: hashedPassword,
      bio: 'Developer advocate turned indie hacker.',
      website: 'https://ninapatel.io',
      twitter: '@nina_codes',
      location: 'Toronto, Canada',
      guessAccuracy: 81,
      guessRank: 8,
      totalMRR: 9800,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'ryan@example.com',
      name: 'Ryan Lee',
      username: 'ryanlee',
      password: hashedPassword,
      bio: 'Ex-Amazon PM. Building productivity tools.',
      website: 'https://ryanlee.dev',
      twitter: '@ryanlee_pm',
      location: 'Denver, CO',
      guessAccuracy: 76,
      guessRank: 15,
      totalMRR: 18500,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: 'olivia@example.com',
      name: 'Olivia Martinez',
      username: 'oliviam',
      password: hashedPassword,
      bio: 'Marketing expert building SaaS for marketers.',
      website: 'https://oliviamartinez.com',
      twitter: '@olivia_mktg',
      location: 'Miami, FL',
      guessAccuracy: 93,
      guessRank: 1,
      totalMRR: 31000,
      onboardingCompleted: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO User (id, email, name, username, password, bio, website, twitter, location, guessAccuracy, guessRank, totalMRR, onboardingCompleted, createdAt, updatedAt)
    VALUES (@id, @email, @name, @username, @password, @bio, @website, @twitter, @location, @guessAccuracy, @guessRank, @totalMRR, @onboardingCompleted, @createdAt, @updatedAt)
  `);

  for (const user of users) {
    insertUser.run(user);
  }

  console.log('✅ Created users:', users.map(u => u.username).join(', '));

  // Create badges
  const badges = [
    { id: randomUUID(), userId: users[0].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[0].id, type: 'REVENUE_100K', earnedAt: now },
    { id: randomUUID(), userId: users[1].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[1].id, type: 'TOP_GUESSER', earnedAt: now },
    { id: randomUUID(), userId: users[2].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[2].id, type: 'EARLY_ADOPTER', earnedAt: now },
    { id: randomUUID(), userId: users[3].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[3].id, type: 'TOP_GUESSER', earnedAt: now },
    { id: randomUUID(), userId: users[4].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[4].id, type: 'REVENUE_100K', earnedAt: now },
    { id: randomUUID(), userId: users[5].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[5].id, type: 'EXIT_MASTER', earnedAt: now },
    { id: randomUUID(), userId: users[6].id, type: 'EARLY_ADOPTER', earnedAt: now },
    { id: randomUUID(), userId: users[7].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[8].id, type: 'MAKER', earnedAt: now },
    { id: randomUUID(), userId: users[9].id, type: 'TOP_GUESSER', earnedAt: now },
    { id: randomUUID(), userId: users[9].id, type: 'MAKER', earnedAt: now },
  ];

  const insertBadge = db.prepare(`
    INSERT OR IGNORE INTO Badge (id, userId, type, earnedAt)
    VALUES (@id, @userId, @type, @earnedAt)
  `);

  for (const badge of badges) {
    insertBadge.run(badge);
  }

  console.log('✅ Created badges');

  // Create startups (12 startups)
  const startups = [
    {
      id: randomUUID(),
      name: 'FormFlow',
      slug: 'formflow',
      tagline: 'Beautiful forms that convert. No code required.',
      description: 'FormFlow is a no-code form builder designed for marketers and product teams. Create stunning forms, surveys, and quizzes in minutes.',
      website: 'https://formflow.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=formflow',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 12500,
      growthMoM: 15.2,
      revenueAge: 18,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 234,
      commentCount: 45,
      guessCount: 156,
      buyerInterestCount: 0,
      categories: JSON.stringify(['SaaS', 'No-Code', 'Marketing']),
      launchDate: '2023-06-15',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'APIMonitor',
      slug: 'apimonitor',
      tagline: 'Real-time API monitoring for developers',
      description: 'APIMonitor helps development teams monitor their APIs in real-time with instant alerts, detailed analytics, and beautiful dashboards.',
      website: 'https://apimonitor.dev',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=apimonitor',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 3200,
      growthMoM: 8.5,
      revenueAge: 12,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 178,
      commentCount: 32,
      guessCount: 89,
      buyerInterestCount: 0,
      categories: JSON.stringify(['Developer Tools', 'SaaS']),
      launchDate: '2023-09-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'ContentPilot',
      slug: 'contentpilot',
      tagline: 'AI-powered content scheduling for social media',
      description: 'ContentPilot uses AI to help you create and schedule content across all your social media platforms. Save hours every week.',
      website: 'https://contentpilot.ai',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=contentpilot',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 8500,
      growthMoM: 22.3,
      revenueAge: 8,
      stage: 'EXIT_READY',
      askingPrice: 250000,
      saleMultiple: 2.5,
      saleIncludes: JSON.stringify(['Source code', 'Customer base', 'Domain', 'Social accounts']),
      saleReason: 'Focusing on new venture',
      upvoteCount: 312,
      commentCount: 67,
      guessCount: 203,
      buyerInterestCount: 12,
      categories: JSON.stringify(['AI', 'Social Media', 'Marketing']),
      launchDate: '2024-02-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'InvoiceHero',
      slug: 'invoicehero',
      tagline: 'Simple invoicing for freelancers',
      description: 'InvoiceHero makes invoicing dead simple. Create professional invoices in seconds and get paid faster.',
      website: 'https://invoicehero.app',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=invoicehero',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 1800,
      growthMoM: 5.0,
      revenueAge: 6,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 89,
      commentCount: 15,
      guessCount: 45,
      buyerInterestCount: 0,
      categories: JSON.stringify(['Fintech', 'Freelance', 'SaaS']),
      launchDate: '2024-06-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'DesignKit',
      slug: 'designkit',
      tagline: 'UI components for busy developers',
      description: 'DesignKit provides production-ready UI components that work with any framework. Ship beautiful products faster.',
      website: 'https://designkit.dev',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=designkit',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 28000,
      growthMoM: 18.7,
      revenueAge: 24,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 456,
      commentCount: 89,
      guessCount: 287,
      buyerInterestCount: 0,
      categories: JSON.stringify(['Developer Tools', 'Design', 'SaaS']),
      launchDate: '2023-01-15',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'EmailBoost',
      slug: 'emailboost',
      tagline: 'Cold email campaigns that actually work',
      description: 'EmailBoost helps sales teams send personalized cold emails at scale. AI-powered warming and deliverability optimization.',
      website: 'https://emailboost.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=emailboost',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 45000,
      growthMoM: 12.4,
      revenueAge: 30,
      stage: 'FOR_SALE',
      askingPrice: 1200000,
      saleMultiple: 2.2,
      saleIncludes: JSON.stringify(['Source code', 'Customer base', 'Domain', 'Team (optional)']),
      saleReason: 'Ready for next chapter',
      upvoteCount: 567,
      commentCount: 123,
      guessCount: 345,
      buyerInterestCount: 28,
      categories: JSON.stringify(['Email', 'Sales', 'AI']),
      launchDate: '2022-06-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'FeedbackLoop',
      slug: 'feedbackloop',
      tagline: 'Customer feedback made simple',
      description: 'FeedbackLoop collects and organizes customer feedback in one place. Prioritize features based on real customer demand.',
      website: 'https://feedbackloop.app',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=feedbackloop',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 6200,
      growthMoM: 9.8,
      revenueAge: 14,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 234,
      commentCount: 56,
      guessCount: 134,
      buyerInterestCount: 0,
      categories: JSON.stringify(['Product', 'Feedback', 'SaaS']),
      launchDate: '2023-11-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'DataSync',
      slug: 'datasync',
      tagline: 'Connect your apps. Automate workflows.',
      description: 'DataSync integrates with 500+ apps to automate your workflows. Like Zapier but for power users.',
      website: 'https://datasync.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=datasync',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 67000,
      growthMoM: 25.3,
      revenueAge: 36,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 789,
      commentCount: 167,
      guessCount: 456,
      buyerInterestCount: 0,
      categories: JSON.stringify(['Automation', 'Integration', 'SaaS']),
      launchDate: '2022-01-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'LandingBuilder',
      slug: 'landingbuilder',
      tagline: 'Launch landing pages in minutes',
      description: 'LandingBuilder lets you create high-converting landing pages without any coding skills. Drag, drop, and publish.',
      website: 'https://landingbuilder.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=landingbuilder',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 15800,
      growthMoM: 14.2,
      revenueAge: 20,
      stage: 'EXIT_READY',
      askingPrice: 450000,
      saleMultiple: 2.4,
      saleIncludes: JSON.stringify(['Source code', 'Customer base', 'Domain', 'Templates']),
      saleReason: 'Moving to enterprise focus',
      upvoteCount: 345,
      commentCount: 78,
      guessCount: 198,
      buyerInterestCount: 15,
      categories: JSON.stringify(['No-Code', 'Marketing', 'Landing Pages']),
      launchDate: '2023-05-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'MetricsHub',
      slug: 'metricshub',
      tagline: 'Track all your SaaS metrics in one dashboard',
      description: 'MetricsHub connects to your payment provider and gives you a beautiful dashboard with all your key metrics. MRR, churn, LTV, and more.',
      website: 'https://metricshub.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=metricshub',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 9200,
      growthMoM: 11.5,
      revenueAge: 16,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 278,
      commentCount: 45,
      guessCount: 167,
      buyerInterestCount: 0,
      categories: JSON.stringify(['Analytics', 'SaaS', 'Metrics']),
      launchDate: '2023-09-15',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'NotionSync',
      slug: 'notionsync',
      tagline: 'Backup and sync your Notion workspace',
      description: 'NotionSync automatically backs up your Notion workspace to GitHub, Google Drive, or Dropbox. Never lose your data again.',
      website: 'https://notionsync.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=notionsync',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 4500,
      growthMoM: 7.8,
      revenueAge: 10,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 156,
      commentCount: 34,
      guessCount: 89,
      buyerInterestCount: 0,
      categories: JSON.stringify(['Productivity', 'Notion', 'Backup']),
      launchDate: '2024-03-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: 'CalendarAI',
      slug: 'calendarai',
      tagline: 'AI scheduling assistant for teams',
      description: 'CalendarAI uses AI to find the perfect meeting times for your team. No more back-and-forth emails.',
      website: 'https://calendarai.app',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=calendarai',
      screenshots: '[]',
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 18500,
      growthMoM: 20.1,
      revenueAge: 12,
      stage: 'MAKING_MONEY',
      askingPrice: null,
      saleMultiple: null,
      saleIncludes: '[]',
      saleReason: null,
      upvoteCount: 423,
      commentCount: 89,
      guessCount: 234,
      buyerInterestCount: 0,
      categories: JSON.stringify(['AI', 'Productivity', 'Scheduling']),
      launchDate: '2024-01-01',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const insertStartup = db.prepare(`
    INSERT OR IGNORE INTO Startup (id, name, slug, tagline, description, website, logo, screenshots, verificationStatus, verificationProvider, currentMRR, growthMoM, revenueAge, stage, askingPrice, saleMultiple, saleIncludes, saleReason, upvoteCount, commentCount, guessCount, buyerInterestCount, categories, launchDate, createdAt, updatedAt)
    VALUES (@id, @name, @slug, @tagline, @description, @website, @logo, @screenshots, @verificationStatus, @verificationProvider, @currentMRR, @growthMoM, @revenueAge, @stage, @askingPrice, @saleMultiple, @saleIncludes, @saleReason, @upvoteCount, @commentCount, @guessCount, @buyerInterestCount, @categories, @launchDate, @createdAt, @updatedAt)
  `);

  for (const startup of startups) {
    insertStartup.run(startup);
  }

  console.log('✅ Created startups:', startups.length);

  // Create startup makers
  const makers = [
    { id: randomUUID(), startupId: startups[0].id, userId: users[0].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[1].id, userId: users[1].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[2].id, userId: users[1].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[3].id, userId: users[2].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[4].id, userId: users[3].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[5].id, userId: users[4].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[6].id, userId: users[5].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[7].id, userId: users[5].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[8].id, userId: users[6].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[9].id, userId: users[7].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[10].id, userId: users[8].id, role: 'founder' },
    { id: randomUUID(), startupId: startups[11].id, userId: users[9].id, role: 'founder' },
  ];

  const insertMaker = db.prepare(`
    INSERT OR IGNORE INTO StartupMaker (id, startupId, userId, role)
    VALUES (@id, @startupId, @userId, @role)
  `);

  for (const maker of makers) {
    insertMaker.run(maker);
  }

  console.log('✅ Created startup makers');

  // Create forum threads
  const threads = [
    {
      id: randomUUID(),
      userId: users[0].id,
      title: 'How I grew my SaaS from $0 to $12K MRR in 18 months',
      content: 'Hey everyone! I wanted to share my journey with FormFlow and the strategies that worked for me. First, I focused on SEO from day one...',
      category: 'REVENUE_GROWTH',
      isPinned: 1,
      upvotes: 45,
      createdAt: pastDates[0],
      updatedAt: pastDates[0],
    },
    {
      id: randomUUID(),
      userId: users[1].id,
      title: 'When is the right time to sell your startup?',
      content: 'I\'m at $8.5K MRR with ContentPilot and getting acquisition offers. How do you know when it\'s the right time to exit?',
      category: 'EXIT_STRATEGY',
      isPinned: 0,
      upvotes: 32,
      createdAt: pastDates[1],
      updatedAt: pastDates[1],
    },
    {
      id: randomUUID(),
      userId: users[4].id,
      title: 'AMA: I sold my SaaS for $1.2M - ask me anything',
      content: 'Hey Exitasy community! I recently completed the sale of my email marketing SaaS for $1.2M. Happy to answer any questions about the process.',
      category: 'AMA',
      isPinned: 1,
      upvotes: 89,
      createdAt: pastDates[2],
      updatedAt: pastDates[2],
    },
    {
      id: randomUUID(),
      userId: users[3].id,
      title: 'Best strategies for reducing churn in B2B SaaS',
      content: 'I\'ve been struggling with churn lately (around 8% monthly). What strategies have worked for you to keep customers engaged?',
      category: 'REVENUE_GROWTH',
      isPinned: 0,
      upvotes: 28,
      createdAt: pastDates[3],
      updatedAt: pastDates[3],
    },
    {
      id: randomUUID(),
      userId: users[5].id,
      title: 'Show & Tell: DataSync hit $67K MRR!',
      content: 'Excited to share that DataSync just crossed $67K MRR! Here\'s a breakdown of what\'s working and our plans for the next milestone.',
      category: 'SHOW_TELL',
      isPinned: 0,
      upvotes: 56,
      createdAt: pastDates[4],
      updatedAt: pastDates[4],
    },
    {
      id: randomUUID(),
      userId: users[7].id,
      title: 'Acquisition process: What to expect and prepare for',
      content: 'Going through due diligence right now. Wanted to share what I\'ve learned so far and what documents you should have ready.',
      category: 'ACQUISITION',
      isPinned: 0,
      upvotes: 41,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const insertThread = db.prepare(`
    INSERT OR IGNORE INTO ForumThread (id, userId, title, content, category, isPinned, upvotes, createdAt, updatedAt)
    VALUES (@id, @userId, @title, @content, @category, @isPinned, @upvotes, @createdAt, @updatedAt)
  `);

  for (const thread of threads) {
    insertThread.run(thread);
  }

  console.log('✅ Created forum threads:', threads.length);

  // Create forum replies
  const replies = [
    { id: randomUUID(), threadId: threads[0].id, userId: users[1].id, content: 'This is really inspiring! How did you handle your initial marketing budget?', createdAt: pastDates[0] },
    { id: randomUUID(), threadId: threads[0].id, userId: users[2].id, content: 'Great post! The SEO strategy you mentioned sounds solid. Any specific tools you recommend?', createdAt: pastDates[1] },
    { id: randomUUID(), threadId: threads[0].id, userId: users[4].id, content: 'Congrats on the growth! Did you do any paid acquisition or was it all organic?', createdAt: pastDates[2] },
    { id: randomUUID(), threadId: threads[1].id, userId: users[0].id, content: 'I think it depends on your personal goals. Are you looking to build for the long term or ready for the next adventure?', createdAt: pastDates[1] },
    { id: randomUUID(), threadId: threads[1].id, userId: users[5].id, content: 'Great question! I\'d suggest talking to multiple potential buyers to understand your options.', createdAt: pastDates[2] },
    { id: randomUUID(), threadId: threads[2].id, userId: users[1].id, content: 'Amazing exit! How long did the due diligence process take?', createdAt: pastDates[2] },
    { id: randomUUID(), threadId: threads[2].id, userId: users[3].id, content: 'Congrats! What was the multiple on revenue?', createdAt: pastDates[3] },
    { id: randomUUID(), threadId: threads[2].id, userId: users[6].id, content: 'Did you use a broker or negotiate directly with the buyer?', createdAt: pastDates[4] },
    { id: randomUUID(), threadId: threads[3].id, userId: users[7].id, content: 'We reduced churn by implementing better onboarding. Made a huge difference!', createdAt: pastDates[4] },
    { id: randomUUID(), threadId: threads[4].id, userId: users[8].id, content: 'That\'s incredible growth! What\'s your customer acquisition strategy?', createdAt: now },
  ];

  const insertReply = db.prepare(`
    INSERT OR IGNORE INTO ForumReply (id, threadId, userId, content, createdAt)
    VALUES (@id, @threadId, @userId, @content, @createdAt)
  `);

  for (const reply of replies) {
    insertReply.run(reply);
  }

  console.log('✅ Created forum replies:', replies.length);

  // Create comments on startups
  const comments = [
    { id: randomUUID(), startupId: startups[0].id, userId: users[1].id, content: 'Love the clean UI! How did you handle form validation?', createdAt: pastDates[0], updatedAt: pastDates[0] },
    { id: randomUUID(), startupId: startups[0].id, userId: users[3].id, content: 'FormFlow has been a game changer for our marketing team. Highly recommend!', createdAt: pastDates[1], updatedAt: pastDates[1] },
    { id: randomUUID(), startupId: startups[1].id, userId: users[0].id, content: 'Been using this for 3 months. The alerts are super reliable.', createdAt: pastDates[2], updatedAt: pastDates[2] },
    { id: randomUUID(), startupId: startups[2].id, userId: users[4].id, content: 'Great product! Would be interested in acquiring. DM me.', createdAt: pastDates[3], updatedAt: pastDates[3] },
    { id: randomUUID(), startupId: startups[4].id, userId: users[5].id, content: 'The component library is fantastic. Saved us weeks of development time.', createdAt: pastDates[4], updatedAt: pastDates[4] },
    { id: randomUUID(), startupId: startups[5].id, userId: users[6].id, content: 'Interested in the acquisition. What\'s the tech stack?', createdAt: now, updatedAt: now },
    { id: randomUUID(), startupId: startups[7].id, userId: users[8].id, content: 'DataSync has been essential for our operations. Best integration tool out there!', createdAt: now, updatedAt: now },
    { id: randomUUID(), startupId: startups[11].id, userId: users[1].id, content: 'The AI scheduling is incredibly accurate. Love it!', createdAt: now, updatedAt: now },
  ];

  const insertComment = db.prepare(`
    INSERT OR IGNORE INTO Comment (id, startupId, userId, content, createdAt, updatedAt)
    VALUES (@id, @startupId, @userId, @content, @createdAt, @updatedAt)
  `);

  for (const comment of comments) {
    insertComment.run(comment);
  }

  console.log('✅ Created comments:', comments.length);

  // Create guesses
  const guesses = [
    { id: randomUUID(), startupId: startups[0].id, userId: users[1].id, range: 'RANGE_10K_20K', isCorrect: 1, createdAt: pastDates[0] },
    { id: randomUUID(), startupId: startups[0].id, userId: users[2].id, range: 'RANGE_5K_10K', isCorrect: 0, createdAt: pastDates[1] },
    { id: randomUUID(), startupId: startups[1].id, userId: users[0].id, range: 'RANGE_1K_5K', isCorrect: 1, createdAt: pastDates[2] },
    { id: randomUUID(), startupId: startups[2].id, userId: users[3].id, range: 'RANGE_5K_10K', isCorrect: 1, createdAt: pastDates[3] },
    { id: randomUUID(), startupId: startups[4].id, userId: users[5].id, range: 'RANGE_20K_50K', isCorrect: 1, createdAt: pastDates[4] },
    { id: randomUUID(), startupId: startups[5].id, userId: users[6].id, range: 'RANGE_50K_PLUS', isCorrect: 0, createdAt: now },
    { id: randomUUID(), startupId: startups[7].id, userId: users[8].id, range: 'RANGE_50K_PLUS', isCorrect: 1, createdAt: now },
    { id: randomUUID(), startupId: startups[11].id, userId: users[9].id, range: 'RANGE_10K_20K', isCorrect: 1, createdAt: now },
  ];

  const insertGuess = db.prepare(`
    INSERT OR IGNORE INTO Guess (id, startupId, userId, range, isCorrect, createdAt)
    VALUES (@id, @startupId, @userId, @range, @isCorrect, @createdAt)
  `);

  for (const guess of guesses) {
    insertGuess.run(guess);
  }

  console.log('✅ Created guesses:', guesses.length);

  // Create upvotes
  const upvotes = [
    { id: randomUUID(), startupId: startups[0].id, userId: users[1].id, createdAt: pastDates[0] },
    { id: randomUUID(), startupId: startups[0].id, userId: users[2].id, createdAt: pastDates[1] },
    { id: randomUUID(), startupId: startups[0].id, userId: users[3].id, createdAt: pastDates[2] },
    { id: randomUUID(), startupId: startups[1].id, userId: users[0].id, createdAt: pastDates[0] },
    { id: randomUUID(), startupId: startups[2].id, userId: users[4].id, createdAt: pastDates[1] },
    { id: randomUUID(), startupId: startups[4].id, userId: users[5].id, createdAt: pastDates[2] },
    { id: randomUUID(), startupId: startups[5].id, userId: users[6].id, createdAt: pastDates[3] },
    { id: randomUUID(), startupId: startups[7].id, userId: users[8].id, createdAt: pastDates[4] },
    { id: randomUUID(), startupId: startups[11].id, userId: users[9].id, createdAt: now },
  ];

  const insertUpvote = db.prepare(`
    INSERT OR IGNORE INTO Upvote (id, startupId, userId, createdAt)
    VALUES (@id, @startupId, @userId, @createdAt)
  `);

  for (const upvote of upvotes) {
    insertUpvote.run(upvote);
  }

  console.log('✅ Created upvotes:', upvotes.length);

  // Create buyer interests
  const buyerInterests = [
    { id: randomUUID(), startupId: startups[2].id, userId: users[4].id, message: 'Interested in acquiring. Would love to discuss.', createdAt: pastDates[3] },
    { id: randomUUID(), startupId: startups[5].id, userId: users[6].id, message: 'Looking to expand our portfolio. This fits perfectly.', createdAt: pastDates[4] },
    { id: randomUUID(), startupId: startups[5].id, userId: users[7].id, message: 'Serious buyer here. Can we schedule a call?', createdAt: now },
    { id: randomUUID(), startupId: startups[8].id, userId: users[9].id, message: 'Love the product. Would be interested in acquiring.', createdAt: now },
  ];

  const insertBuyerInterest = db.prepare(`
    INSERT OR IGNORE INTO BuyerInterest (id, startupId, userId, message, createdAt)
    VALUES (@id, @startupId, @userId, @message, @createdAt)
  `);

  for (const interest of buyerInterests) {
    insertBuyerInterest.run(interest);
  }

  console.log('✅ Created buyer interests:', buyerInterests.length);

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  👤 Users: ${users.length}`);
  console.log(`  🏢 Startups: ${startups.length}`);
  console.log(`  💬 Forum Threads: ${threads.length}`);
  console.log(`  💭 Forum Replies: ${replies.length}`);
  console.log(`  📝 Comments: ${comments.length}`);
  console.log(`  🎯 Guesses: ${guesses.length}`);
  console.log(`  👍 Upvotes: ${upvotes.length}`);
  console.log(`  💰 Buyer Interests: ${buyerInterests.length}`);
  console.log('');
  console.log('Test accounts (all use password: password123):');
  users.forEach(u => console.log(`  📧 ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.close();
  });
