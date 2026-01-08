# Exitasy

The community where SaaS founders flex real revenue. No ideas. No promises. Just verified money makers.

## Features

- **Revenue-Verified Startups**: Showcase SaaS products with Stripe-verified revenue
- **MRR Guessing Game**: Guess the Monthly Recurring Revenue of startups
- **For Sale Marketplace**: Browse and list startups for acquisition
- **Community Forum**: Discuss revenue growth, exit strategies, and acquisitions
- **Leaderboard**: Track top guessers and trending startups

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: NextAuth.js v4
- **Database**: Prisma ORM + SQLite (local) / PostgreSQL (production)
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/exitasy.git
cd exitasy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Add OAuth provider credentials (Google, GitHub, Twitter)
- Add Stripe credentials for revenue verification

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Seed the database (optional):
```bash
node prisma/seed-sqlite.mjs
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Test Accounts

After seeding, you can log in with these test accounts:

| Email | Password |
|-------|----------|
| alex@example.com | password123 |
| sarah@example.com | password123 |
| mike@example.com | password123 |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Use a cloud database (e.g., PlanetScale, Neon, Supabase) for production

### Environment Variables for Production

Required environment variables for Vercel:

- `DATABASE_URL` - Cloud database connection string
- `NEXTAUTH_URL` - Production URL (e.g., https://exitasy.com)
- `NEXTAUTH_SECRET` - Random 32-character secret
- OAuth credentials (optional):
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
  - `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
- Stripe credentials (optional):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_CLIENT_ID`
  - `STRIPE_WEBHOOK_SECRET`

## Project Structure

```
exitasy/
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed-sqlite.mjs   # Seed script
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── feed/         # Feed components
│   │   ├── layout/       # Layout components
│   │   ├── startup/      # Startup-related components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript types
├── public/               # Static assets
└── package.json
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/*` | ALL | NextAuth.js routes |
| `/api/startups` | GET/POST | List/create startups |
| `/api/startups/[slug]` | GET | Get startup details |
| `/api/startups/[slug]/upvote` | POST | Upvote a startup |
| `/api/startups/[slug]/guess` | POST | Guess MRR |
| `/api/startups/[slug]/interest` | POST | Express buyer interest |
| `/api/leaderboard` | GET | Get leaderboard |
| `/api/forum` | GET/POST | List/create forum threads |
| `/api/forum/[id]` | GET | Get thread details |

## License

MIT License
