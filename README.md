# ReviewIQ — Human-in-the-Loop AI SaaS

A production-ready multi-tenant SaaS platform where AI drafts answers and human experts review before final delivery.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Auth0** (@auth0/nextjs-auth0 v3) — Authentication
- **Prisma + PostgreSQL** — Database
- **Google Gemini** — AI (Flash for drafts, Pro for final answers)
- **Tailwind CSS** — Neobrutalism UI

## Features
- Multi-tenant: Each service gets a unique `SVC-XXXXXXXX` code
- HITL flow: Query → AI Draft → Human Review (Edit/Approve/Reject) → Final AI Answer
- Role-based: ADMIN (creates service) + REVIEWER (joins with code)
- Real-time review queue with auto-refresh
- Neobrutalism design system

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
- **Auth0**: Create an app at [auth0.com](https://auth0.com). Set callback URL to `http://localhost:3000/api/auth/callback` and logout URL to `http://localhost:3000`.
- **Database**: PostgreSQL connection string
- **Google AI**: Get API key from [Google AI Studio](https://aistudio.google.com)

### 3. Set up database
```bash
npm run db:migrate
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## User Flow

### Admin (Service Owner)
1. Sign up via Auth0
2. Go to Dashboard → Admin → Create Service
3. Get your `SVC-XXXXXXXX` code
4. Share code with your reviewer team

### Reviewer (Worker)
1. Sign up via Auth0
2. Go to Dashboard → Admin → Join Service
3. Enter the service code
4. Access the Review Queue

### Querying
1. Any service member submits a query
2. AI (Gemini Flash) generates a draft in seconds
3. Reviewer sees draft in Review Queue
4. Reviewer Approves / Edits / Rejects
5. On approval/edit: Gemini Pro generates detailed final answer
6. Query submitter sees the final answer

---

## Project Structure
```
app/
├── api/
│   ├── auth/[auth0]/     # Auth0 handler
│   ├── services/         # Create/list services
│   ├── join/             # Join service with code
│   ├── queries/          # Submit/list queries
│   │   └── [id]/review/  # Submit review + trigger final AI
│   └── user/             # User profile & memberships
├── dashboard/
│   ├── page.tsx          # Service hub + onboarding
│   ├── admin/            # Service creation & joining
│   ├── reviewer/         # Review queue
│   └── queries/          # Query submission & history
└── page.tsx              # Landing page

components/
├── ui/                   # Neobrutalism primitives
├── landing/              # Hero, features, how-it-works
└── dashboard/            # Navbar, QueryForm, ReviewCard, QueryCard

lib/
├── db.ts                 # Prisma singleton
├── genai.ts              # Google GenAI wrappers
└── utils.ts              # Helpers, service code generator

prisma/schema.prisma      # Service, ServiceMember, Query, Review
```

## Production Deployment
1. Deploy to [Vercel](https://vercel.com)
2. Add environment variables in Vercel dashboard
3. Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for PostgreSQL
4. Update Auth0 callback URLs to your production domain
5. Run `prisma migrate deploy` via build command
