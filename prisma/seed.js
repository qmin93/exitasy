const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {},
    create: {
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
      onboardingCompleted: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
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
      onboardingCompleted: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      name: 'Mike Johnson',
      username: 'mikej',
      password: hashedPassword,
      bio: 'Full-stack developer turned entrepreneur.',
      twitter: '@mikej_dev',
      location: 'New York, NY',
      guessAccuracy: 62,
      guessRank: 45,
      totalMRR: 3200,
      onboardingCompleted: true,
    },
  });

  console.log('✅ Created users:', user1.username, user2.username, user3.username);

  // Create badges
  const badgeData = [
    { userId: user1.id, type: 'MAKER' },
    { userId: user1.id, type: 'REVENUE_100K' },
    { userId: user2.id, type: 'MAKER' },
    { userId: user2.id, type: 'TOP_GUESSER' },
    { userId: user3.id, type: 'MAKER' },
    { userId: user3.id, type: 'EARLY_ADOPTER' },
  ];

  for (const badge of badgeData) {
    try {
      await prisma.badge.create({ data: badge });
    } catch {
      // Ignore duplicate errors
    }
  }

  console.log('✅ Created badges');

  // Create startups
  const startup1 = await prisma.startup.upsert({
    where: { slug: 'formflow' },
    update: {},
    create: {
      name: 'FormFlow',
      slug: 'formflow',
      tagline: 'Beautiful forms that convert. No code required.',
      description: 'FormFlow is a no-code form builder designed for marketers and product teams. Create stunning forms, surveys, and quizzes in minutes.\n\n## Features\n- Drag & drop builder\n- 50+ templates\n- Advanced analytics\n- Zapier integration\n- Custom branding',
      website: 'https://formflow.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=formflow',
      screenshots: JSON.stringify(['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800']),
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 12500,
      growthMoM: 15.2,
      revenueAge: 18,
      stage: 'MAKING_MONEY',
      upvoteCount: 234,
      commentCount: 45,
      guessCount: 156,
      categories: JSON.stringify(['SaaS', 'No-Code', 'Marketing']),
      launchDate: new Date('2023-06-15'),
    },
  });

  const startup2 = await prisma.startup.upsert({
    where: { slug: 'apimonitor' },
    update: {},
    create: {
      name: 'APIMonitor',
      slug: 'apimonitor',
      tagline: 'Real-time API monitoring for developers',
      description: 'APIMonitor helps development teams monitor their APIs in real-time with instant alerts and detailed analytics.',
      website: 'https://apimonitor.dev',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=apimonitor',
      screenshots: JSON.stringify([]),
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 3200,
      growthMoM: 8.5,
      revenueAge: 12,
      stage: 'MAKING_MONEY',
      upvoteCount: 178,
      commentCount: 32,
      guessCount: 89,
      categories: JSON.stringify(['Developer Tools', 'SaaS', 'Monitoring']),
      launchDate: new Date('2023-09-01'),
    },
  });

  const startup3 = await prisma.startup.upsert({
    where: { slug: 'contentpilot' },
    update: {},
    create: {
      name: 'ContentPilot',
      slug: 'contentpilot',
      tagline: 'AI-powered content scheduling for social media',
      description: 'ContentPilot uses AI to help you create, schedule, and optimize your social media content.',
      website: 'https://contentpilot.ai',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=contentpilot',
      screenshots: JSON.stringify([]),
      verificationStatus: 'VERIFIED',
      verificationProvider: 'STRIPE',
      currentMRR: 8500,
      growthMoM: 22.3,
      revenueAge: 8,
      stage: 'EXIT_READY',
      askingPrice: 250000,
      saleMultiple: 2.5,
      saleIncludes: JSON.stringify(['Source code', 'Customer base', '3 months support']),
      saleReason: 'Focusing on new venture',
      upvoteCount: 312,
      commentCount: 67,
      guessCount: 203,
      buyerInterestCount: 12,
      categories: JSON.stringify(['AI', 'Social Media', 'Marketing']),
      launchDate: new Date('2024-02-01'),
    },
  });

  const startup4 = await prisma.startup.upsert({
    where: { slug: 'invoicehero' },
    update: {},
    create: {
      name: 'InvoiceHero',
      slug: 'invoicehero',
      tagline: 'Simple invoicing for freelancers',
      description: 'InvoiceHero makes invoicing dead simple. Create professional invoices in seconds and get paid faster.',
      website: 'https://invoicehero.app',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=invoicehero',
      screenshots: JSON.stringify([]),
      verificationStatus: 'PENDING',
      currentMRR: 1800,
      growthMoM: 5.0,
      revenueAge: 6,
      stage: 'MAKING_MONEY',
      upvoteCount: 89,
      commentCount: 15,
      guessCount: 45,
      categories: JSON.stringify(['Fintech', 'Freelance', 'SaaS']),
      launchDate: new Date('2024-06-01'),
    },
  });

  console.log('✅ Created startups');

  // Create startup makers
  const makerData = [
    { startupId: startup1.id, userId: user1.id, role: 'founder' },
    { startupId: startup2.id, userId: user2.id, role: 'founder' },
    { startupId: startup3.id, userId: user2.id, role: 'founder' },
    { startupId: startup4.id, userId: user3.id, role: 'founder' },
  ];

  for (const maker of makerData) {
    try {
      await prisma.startupMaker.create({ data: maker });
    } catch {
      // Ignore duplicate errors
    }
  }

  console.log('✅ Created startup makers');

  // Create some comments
  const commentData = [
    { content: 'Love the clean UI! How long did it take to build the MVP?', userId: user2.id, startupId: startup1.id },
    { content: 'Been using this for 3 months. Game changer for our team!', userId: user3.id, startupId: startup1.id },
    { content: 'Great product! What tech stack are you using?', userId: user1.id, startupId: startup2.id },
    { content: 'Interested in the acquisition. DMed you!', userId: user1.id, startupId: startup3.id },
  ];

  for (const comment of commentData) {
    try {
      await prisma.comment.create({ data: comment });
    } catch {
      // Ignore errors
    }
  }

  console.log('✅ Created comments');

  // Create some upvotes
  const upvoteData = [
    { userId: user2.id, startupId: startup1.id },
    { userId: user3.id, startupId: startup1.id },
    { userId: user1.id, startupId: startup2.id },
    { userId: user3.id, startupId: startup2.id },
    { userId: user1.id, startupId: startup3.id },
    { userId: user3.id, startupId: startup3.id },
  ];

  for (const upvote of upvoteData) {
    try {
      await prisma.upvote.create({ data: upvote });
    } catch {
      // Ignore duplicate errors
    }
  }

  console.log('✅ Created upvotes');

  // Create some guesses
  const guessData = [
    { userId: user2.id, startupId: startup1.id, range: 'RANGE_10K_20K', isCorrect: true },
    { userId: user3.id, startupId: startup1.id, range: 'RANGE_5K_10K', isCorrect: false },
    { userId: user1.id, startupId: startup2.id, range: 'RANGE_1K_5K', isCorrect: true },
    { userId: user1.id, startupId: startup3.id, range: 'RANGE_5K_10K', isCorrect: true },
  ];

  for (const guess of guessData) {
    try {
      await prisma.guess.create({ data: guess });
    } catch {
      // Ignore duplicate errors
    }
  }

  console.log('✅ Created guesses');

  // Create buyer interest
  try {
    await prisma.buyerInterest.create({
      data: {
        userId: user1.id,
        startupId: startup3.id,
        isAnonymous: false,
        message: 'Very interested in this acquisition. Can we schedule a call?',
      },
    });
  } catch {
    // Ignore duplicate errors
  }

  console.log('✅ Created buyer interests');

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Test accounts:');
  console.log('  📧 alex@example.com / password123');
  console.log('  📧 sarah@example.com / password123');
  console.log('  📧 mike@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
