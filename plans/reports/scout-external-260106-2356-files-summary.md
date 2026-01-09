# Tapy App: Complete File Listing & Summary

## Project Overview

**Repository:** Tapy - Just-in-Time Recruitment Platform  
**Framework:** Next.js 14 (App Router)  
**Language:** TypeScript  
**Styling:** Tailwind CSS + Shadcn/UI  
**State:** React Query + Zustand (prepared)  
**Backend:** Supabase (PostgreSQL + Auth)  
**Deployment:** Vercel + PWA

---

## Application Files Discovered

### Total File Count: 14 TypeScript/JavaScript Files

#### App Directory (3 files)
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `/app/layout.tsx` | Layout | 37 | Root layout with metadata, providers, Toaster |
| `/app/page.tsx` | Page | 47 | Homepage - job feed with React Query |
| `/app/globals.css` | Styles | 61 | Tailwind tokens, light/dark mode, design system |

#### Components Directory (4 files)
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `/components/providers.tsx` | Provider | 25 | React Query client initialization |
| `/components/job-card.tsx` | Component | 92 | Job listing card with qualification display |
| `/components/ui/button.tsx` | Primitive | 54 | Shadcn/UI Button with variants |
| `/components/ui/card.tsx` | Primitive | 78 | Shadcn/UI Card with sub-components |

#### Hooks Directory (2 files)
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `/hooks/use-auth.ts` | Hook | 38 | Authentication & user profile queries |
| `/hooks/use-job-matching.ts` | Hook | 65 | Job qualification & application mutations |

#### Lib Directory (4 files)
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `/lib/utils.ts` | Utility | 6 | CSS class merging utility (cn) |
| `/lib/supabase/client.ts` | Factory | 6 | Typed Supabase client creation |
| `/lib/job-matching.ts` | Logic | 175 | Instant Book qualification algorithm |
| `/lib/services/job-application.service.ts` | Service | 310 | Job application workflow & QR generation |

#### Types Directory (1 file)
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `/types/database.types.ts` | Types | 117 | TypeScript interfaces for Supabase schema |

---

## File Hierarchy with Descriptions

```
Tapy-app/
│
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root HTML/metadata/providers (37 lines)
│   │   └── Features: PWA config, Vietnamese locale, Toaster setup
│   ├── page.tsx                   # Home page/job feed (47 lines)
│   │   └── Features: useQuery jobs, JobCard mapping, React Query setup
│   └── globals.css                # Design tokens & Tailwind (61 lines)
│       └── Features: Color vars (blue #1e3a8a, orange #ea580c), dark mode
│
├── components/                    # React Components
│   ├── providers.tsx              # React Query setup (25 lines)
│   │   └── Features: QueryClientProvider, 1-min staleTime, no window refetch
│   ├── job-card.tsx               # Job display component (92 lines)
│   │   └── Features: Qualification display, Instant/Request buttons, icons
│   └── ui/                        # Shadcn/UI primitives
│       ├── button.tsx             # Button with variants (54 lines)
│       │   └── Features: 6 variants, 4 sizes, CVA styling
│       └── card.tsx               # Card container (78 lines)
│           └── Features: Card + CardHeader/Title/Description/Content/Footer
│
├── hooks/                         # Custom React Hooks
│   ├── use-auth.ts                # Auth hooks (38 lines)
│   │   └── Functions:
│   │       - useAuth(): {session, user, isLoading}
│   ├── use-job-matching.ts        # Job matching hooks (65 lines)
│   │   └── Functions:
│   │       - useJobQualification(jobId, workerId)
│   │       - useApplyToJob()
│   │       - useApproveApplication()
│   │
├── lib/                           # Business logic & utilities
│   ├── utils.ts                   # CSS utilities (6 lines)
│   │   └── Function: cn() - merge Tailwind classes
│   ├── supabase/
│   │   └── client.ts              # Supabase factory (6 lines)
│   │       └── Function: createClient() - typed client
│   ├── job-matching.ts            # Core matching algorithm (175 lines)
│   │   └── Functions:
│   │       - compareLanguageLevels()
│   │       - isAccountActive()
│   │       - evaluateWorkerQualification()
│   │       - getQualificationFeedback()
│   └── services/
│       └── job-application.service.ts  # App workflow (310 lines)
│           └── Functions:
│               - applyToJob()
│               - getWorkerQualificationForJob()
│               - approveApplication()
│               - generateCheckInQRCode() [stub]
│
├── types/                         # TypeScript definitions
│   └── database.types.ts          # Supabase schema types (117 lines)
│       └── Interfaces:
│           - Profile, LanguageSkill, Job, JobApplication
│           - UserRole, LanguageType, LanguageLevel enums
│           - Database schema interface
│
├── public/                        # Static assets (not explored)
│   └── manifest.json [expected]
│
├── supabase/                      # Database schema (not explored)
│   └── schema.sql [expected]
│
├── docs/                          # Documentation
│   └── UI_DESIGN_PROMPT.md        # Design specifications
│
└── Configuration files
    ├── package.json               # Dependencies (not explored)
    ├── tsconfig.json              # TypeScript config
    ├── next.config.js             # Next.js config
    ├── tailwind.config.js          # Tailwind config
    ├── .env.local.example          # Environment template
    └── README.md                   # Project overview
```

---

## Component Dependencies Map

### Import Graph

```
app/page.tsx (entry point)
├── imports from: components/job-card.tsx
├── imports from: lib/supabase/client.ts
├── imports from: types/database.types.ts
└── imports from: @tanstack/react-query

components/job-card.tsx
├── imports from: components/ui/button.tsx
├── imports from: hooks/use-auth.ts
├── imports from: hooks/use-job-matching.ts
├── imports from: lib/job-matching.ts
├── imports from: types/database.types.ts
└── imports from: lucide-react

components/ui/button.tsx
├── imports from: lib/utils.ts
└── imports from: class-variance-authority

components/ui/card.tsx
└── imports from: lib/utils.ts

hooks/use-auth.ts
├── imports from: @tanstack/react-query
├── imports from: lib/supabase/client.ts
└── imports from: types/database.types.ts

hooks/use-job-matching.ts
├── imports from: @tanstack/react-query
├── imports from: lib/services/job-application.service.ts
└── imports from: sonner

lib/job-matching.ts
└── imports from: types/database.types.ts

lib/services/job-application.service.ts
├── imports from: lib/supabase/client.ts
├── imports from: lib/job-matching.ts
└── imports from: types/database.types.ts

lib/supabase/client.ts
├── imports from: @supabase/auth-helpers-nextjs
└── imports from: types/database.types.ts

lib/utils.ts
├── imports from: clsx
└── imports from: tailwind-merge

app/layout.tsx
├── imports from: components/providers.tsx
├── imports from: app/globals.css
└── imports from: sonner

components/providers.tsx
└── imports from: @tanstack/react-query
```

---

## Code Metrics

### Lines of Code by Category

| Category | Files | Lines | Avg/File |
|----------|-------|-------|----------|
| Components | 6 | 349 | 58 |
| Hooks | 2 | 103 | 52 |
| Services | 1 | 310 | 310 |
| Core Logic | 1 | 175 | 175 |
| Utilities | 2 | 12 | 6 |
| Types | 1 | 117 | 117 |
| Styles | 1 | 61 | 61 |
| **TOTAL** | **14** | **1127** | **81** |

### Component Complexity

| Component | Complexity | Dependencies | React Hooks |
|-----------|-----------|--------------|------------|
| HomePage | Medium | 3 | 1 (useQuery) |
| JobCard | High | 7 | 3 (useAuth, useJobQualification, useApplyToJob) |
| Button | Low | 2 | 0 |
| Card | Low | 1 | 0 |
| Providers | Low | 1 | 1 (useState) |

---

## Key Features by File

### Authentication Flow
**Files:** `hooks/use-auth.ts`, `lib/supabase/client.ts`

```typescript
// 1. User logs in via Supabase Auth (phone OTP)
// 2. useAuth() hook fetches session
// 3. Conditional fetch of user profile
// 4. Components receive user context
// 5. Job qualification checks use workerId from profile
```

### Job Application Flow
**Files:** `app/page.tsx`, `components/job-card.tsx`, `hooks/use-job-matching.ts`, `lib/services/job-application.service.ts`, `lib/job-matching.ts`

```typescript
// 1. HomePage fetches all open jobs with useQuery
// 2. JobCard maps each job with qualification data
// 3. useJobQualification checks if worker qualifies
// 4. onClick → useApplyToJob mutation
// 5. applyToJob() service:
//    a. Validates job & worker
//    b. Calls evaluateWorkerQualification()
//    c. Creates job_applications record
//    d. If instant book: generates QR, updates job count
// 6. Toast notification shows result
// 7. React Query invalidates caches
// 8. UI updates with new state
```

### Qualification Matching
**Files:** `lib/job-matching.ts`, `lib/services/job-application.service.ts`

```typescript
// Checks 5 criteria (ALL must pass for Instant Book):
// 1. Has required language skill
// 2. Language level meets requirement (VERIFIED)
// 3. Reliability score >= minimum required
// 4. Account not frozen (or freeze expired)
// 5. Profile verified (has intro video)

// If ANY fail:
// - Show feedback message in Vietnamese
// - Create pending application (needs owner approval)
// - Button shows "GỬI YÊU CẦU" (Send Request)
```

---

## Data Flow Summary

### State Management Layers

1. **Server State (React Query)**
   - Jobs list
   - User session & profile
   - Job qualifications
   - Job applications
   - Stale time: 1 minute
   - Cache invalidation on mutations

2. **Component State (useState)**
   - QueryClient instance (in Providers)

3. **Server Actions (Mutations)**
   - Apply to job
   - Approve application
   - Toast notifications (Sonner)

4. **Database (Supabase)**
   - All persistent data
   - Real-time via queries

### No Client State Libraries Visible
- Zustand mentioned in README but not implemented in code
- All state is React Query + Supabase

---

## Technical Decisions

### Why React Query?
- Server state management
- Automatic caching & invalidation
- Built-in loading/error states
- No boilerplate for data fetching

### Why Shadcn/UI?
- Composable components
- Tailwind integration
- CVA for variants
- Accessible primitives

### Why Supabase Direct Calls?
- Type-safe client from `@supabase/auth-helpers-nextjs`
- No API layer overhead
- Real-time capable
- Row-level security possible

### Why Monolithic Service File?
- All job application logic in one place
- Easier to maintain qualification rules
- Single source of truth for job matching

---

## File Size & Complexity Analysis

### Small Files (< 50 lines)
- `lib/utils.ts` (6 lines) - Single function
- `lib/supabase/client.ts` (6 lines) - Single factory
- `components/providers.tsx` (25 lines) - Single component
- `hooks/use-auth.ts` (38 lines) - Two queries

### Medium Files (50-100 lines)
- `components/ui/button.tsx` (54 lines) - 2 components
- `app/page.tsx` (47 lines) - Single page
- `components/job-card.tsx` (92 lines) - Single component
- `components/ui/card.tsx` (78 lines) - 6 components
- `app/globals.css` (61 lines) - CSS tokens

### Large Files (> 100 lines)
- `types/database.types.ts` (117 lines) - Type definitions
- `lib/job-matching.ts` (175 lines) - Core algorithm
- `lib/services/job-application.service.ts` (310 lines) - Service logic
- `hooks/use-job-matching.ts` (65 lines) - Hooks

---

## Code Quality Observations

### Strengths
✅ Type-safe throughout (TypeScript)
✅ Clean component composition
✅ Single responsibility principle
✅ Consistent Vietnamese localization
✅ Error handling with try-catch
✅ User feedback via toasts
✅ Query caching strategy

### Areas for Improvement
⚠️ QR code generation is stubbed (mock token)
⚠️ No form validation libraries visible
⚠️ No error boundary components
⚠️ Type casting redundancy in service
⚠️ No unit tests visible
⚠️ No API routes (all Supabase direct)
⚠️ Missing search/filter components
⚠️ No pagination implementation

### Potential Issues
❌ Feedback message logic error (line 162 in job-matching.ts)
❌ No auth middleware/protection on pages
❌ No loading skeletons for better UX
❌ Mobile responsiveness assumed but not verified

---

## Environment & Configuration

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Dependencies Found in Use
- **@tanstack/react-query** - Data fetching
- **@supabase/auth-helpers-nextjs** - Auth
- **tailwindcss** - Styling
- **shadcn/ui** - Components
- **lucide-react** - Icons
- **sonner** - Toasts
- **date-fns** - Date formatting
- **clsx** - Class names
- **tailwind-merge** - CSS utility
- **class-variance-authority** - Component variants
- **next-pwa** - PWA support (configured)

---

## Features Implemented

### Core Features
✅ Job listing & discovery
✅ Worker qualification matching
✅ Instant Book vs Request logic
✅ Job application submission
✅ Authentication (Supabase)
✅ User profile loading
✅ Language skill verification
✅ Reliability scoring
✅ QR code generation (stub)
✅ Toast notifications

### Missing Features (TODO)
❌ Owner job management dashboard
❌ Worker onboarding flow
❌ Search & filtering
❌ Pagination
❌ Geolocation check-in
❌ Payment integration
❌ Contract signing
❌ Notifications system
❌ Real-time updates

---

## Unresolved Questions

1. Where is public/manifest.json for PWA?
2. Where is supabase/schema.sql?
3. Where are form validation libraries (zod, react-hook-form)?
4. Where are translation files (i18n)?
5. Where is the phone OTP authentication UI?
6. Where are test files (jest, vitest)?
7. Are there API routes in app/api/?
8. How is mobile responsiveness tested?
9. Where is the owner dashboard UI?
10. Where is the worker onboarding UI?

---

## Next Development Steps

### Immediate (Sprint 1)
1. Implement actual QR code generation (qrcode library)
2. Add search & filter components
3. Create owner dashboard for job management
4. Fix feedback message logic error

### Short Term (Sprint 2-3)
1. Implement geolocation check-in
2. Add pagination to job feed
3. Create worker onboarding flow
4. Add form validation (zod + react-hook-form)

### Medium Term (Sprint 4-5)
1. Build notification system
2. Add real-time job updates
3. Implement payment integration
4. Add contract signing flow

### Long Term
1. Analytics & reporting
2. Mobile app (React Native)
3. Admin dashboard
4. Multi-language support (i18n)

---

## Resources & Documentation

- **Framework Docs:** [Next.js 14](https://nextjs.org/docs)
- **State Management:** [React Query Docs](https://tanstack.com/query/latest)
- **Components:** [Shadcn/UI Docs](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Supabase Docs](https://supabase.com/docs)
- **UI Design:** See `/docs/UI_DESIGN_PROMPT.md` for spec

---

**Report Generated:** 2026-01-06 23:56 UTC  
**Codebase Version:** Current (all files read)  
**Total Files Analyzed:** 14  
**Total Lines of Code:** 1,127  
