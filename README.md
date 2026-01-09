# Tapy - Just-in-Time Recruitment Platform

Nền tảng tuyển dụng "Just-in-Time" kết nối nhà hàng Nhật/Hàn tại Việt Nam với nhân viên part-time có kỹ năng ngôn ngữ được xác minh.

**Version:** 1.0 | **Status:** MVP Development | **[Full Documentation](./docs/)**

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Maps API key

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

# Setup database
# 1. Create Supabase project
# 2. Execute supabase/schema.sql in SQL editor
# 3. Note: RLS policies are auto-generated from schema

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript 5.4 |
| **UI/Styling** | Shadcn/UI, Tailwind CSS 3.4 |
| **State** | React Query 5.20, Zustand 4.5 |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **Deployment** | Vercel |
| **PWA** | next-pwa |

---

## Key Features

### 1. Job Discovery Feed
- Real-time job listings with qualification matching
- Filter by language and requirements
- Search functionality (planned)

### 2. Instant Book System
Auto-approves workers meeting **ALL** criteria:
- Verified language skill ✓
- Level meets/exceeds requirement ✓
- Reliability score ≥ minimum ✓
- Account not frozen ✓
- Identity verified ✓

### 3. Language Verification
- Japanese: JLPT (N5-N1)
- Korean: TOPIK (1-6)
- English: CEFR (A1-C2)

### 4. Reliability Scoring
- Initial: 100 points
- Completion: +1 point
- Late check-in: -2 points
- No-show: -20 points + 7-day freeze

### 5. Request to Book
Manual owner approval for workers not meeting Instant Book criteria

---

## Project Structure

```
tapy-app/
├── app/                      # Next.js pages & layouts
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Job discovery feed
│   └── globals.css          # Design system
├── components/              # React components
│   ├── ui/                 # Shadcn/UI primitives
│   ├── job-card.tsx        # Job listing component
│   └── providers.tsx       # Context providers
├── hooks/                   # Custom React hooks
│   ├── use-auth.ts         # Auth & profile
│   └── use-job-matching.ts # Job operations
├── lib/                     # Business logic
│   ├── supabase/           # Database client
│   ├── services/           # Application service
│   ├── job-matching.ts     # Qualification algorithm
│   └── utils.ts            # Helpers
├── types/                   # TypeScript definitions
├── supabase/               # Database schema
├── docs/                   # Documentation
├── public/                 # PWA manifest & assets
└── Configuration files     # tsconfig, tailwind, next.config
```

---

## Core Architecture

### Layered Design
```
Components (JobCard, Button, Card)
    ↓
Hooks (useAuth, useJobQualification, useApplyToJob)
    ↓
Services (job-matching, job-application.service)
    ↓
Database Client (Supabase)
    ↓
PostgreSQL (7 tables, RLS enabled)
```

### Job Application Flow
1. Worker views job on feed
2. `useJobQualification()` evaluates 5 criteria
3. Shows "Instant Book" or "Request to Book"
4. User clicks Apply
5. `applyToJob()` creates application
6. If all criteria met: Auto-approved + QR generated
7. If not: Pending owner approval

---

## Development Guidelines

### Key Standards
- **TypeScript**: Strict mode enabled, full type coverage
- **Components**: Functional, reusable, <200 LOC
- **State**: React Query (server), Zustand (UI, planned)
- **Error Handling**: Try-catch with Vietnamese messages
- **Performance**: Memoization, optimized queries

### Naming Conventions
- **Components**: `PascalCase.tsx` → `JobCard.tsx`
- **Hooks**: `camelCase` with `use` prefix → `use-job-matching.ts`
- **Services**: `camelCase.service.ts` → `job-application.service.ts`
- **Functions**: `camelCase` → `evaluateWorkerQualification()`
- **Booleans**: Prefix with `is/has/can` → `isLoading`, `canInstantBook`

### Code Review Checklist
- [ ] No `any` types, TypeScript strict
- [ ] Components under 200 LOC
- [ ] All props typed with interfaces
- [ ] Error handling implemented
- [ ] Database queries indexed
- [ ] Vietnamese error messages used

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (workers + owners) |
| `language_skills` | Language certifications with levels |
| `jobs` | Job postings with requirements |
| `job_applications` | Applications with Instant Book flag |
| `checkins` | Geolocation-based check-in/out records |
| `reliability_history` | Score change audit log |
| `wallet_transactions` | Payment records |

**All tables have RLS enabled** for data isolation and security.

---

## Implementation Status

### ✅ Completed
- Supabase auth & database setup
- Job matching algorithm (5-criteria evaluation)
- Language level comparison system
- Reliability scoring rules
- Job feed UI with React Query
- Job card component
- Application workflow
- Toast notifications

### ⚠️ In Progress
- Job discovery filters/search
- Pagination for listings
- Owner dashboard
- QR code generation (mock → real)

### ❌ Planned
- E-contract signing
- Wallet & payment integration
- Push notifications
- Admin dashboard
- Advanced analytics

---

## Deployment

### Local Development
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint check
```

### Production (Vercel)
```bash
vercel           # Deploy to production
```

Set environment variables in Vercel dashboard.

---

## Documentation

Complete documentation available in `/docs/`:

- **[project-overview-pdr.md](./docs/project-overview-pdr.md)** - Vision, requirements, roadmap
- **[code-standards.md](./docs/code-standards.md)** - Code structure, naming, patterns
- **[codebase-summary.md](./docs/codebase-summary.md)** - File structure, architecture
- **[system-architecture.md](./docs/system-architecture.md)** - System design, data flow

---

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query/latest)

---

## License

MIT

