import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcryptPkg from 'bcryptjs';
const bcrypt = bcryptPkg;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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
    } catch (e) {}
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
      description: 'FormFlow is a no-code form builder designed for marketers and product teams.',
      website: 'https://formflow.io',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=formflow',
      screenshots: JSON.stringify([]),
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
      description: 'APIMonitor helps development teams monitor their APIs in real-time.',
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
      categories: JSON.stringify(['Developer Tools', 'SaaS']),
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
      description: 'ContentPilot uses AI to help you create and schedule content.',
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
      saleIncludes: JSON.stringify(['Source code', 'Customer base']),
      saleReason: 'Focusing on new venture',
      upvoteCount: 312,
      commentCount: 67,
      guessCount: 203,
      buyerInterestCount: 12,
      categories: JSON.stringify(['AI', 'Social Media']),
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
      description: 'InvoiceHero makes invoicing dead simple.',
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
      categories: JSON.stringify(['Fintech', 'Freelance']),
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
    } catch (e) {}
  }

  console.log('✅ Created startup makers');

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
