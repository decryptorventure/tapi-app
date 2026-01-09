# Tapy System Architecture

**Version:** 1.0
**Last Updated:** 2026-01-07
**System:** Just-in-Time Recruitment Platform

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Service Layer](#service-layer)
5. [State Management](#state-management)
6. [Database Architecture](#database-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Scalability Design](#scalability-design)
10. [API Contract](#api-contract)

---

## High-Level Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Client Applications                   │
│    (Web Browser - Next.js PWA, Mobile-Responsive)      │
└──────────────────────┬──────────────────────────────────┘
                       │
                ┌──────▼──────┐
                │  Next.js 14 │
                │ (App Router)│
                └──────┬──────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼───┐      ┌───▼────┐    ┌───▼────┐
    │ Pages │      │ API    │    │Hooks/  │
    │       │      │Routes  │    │Services│
    └───┬───┘      └───┬────┘    └───┬────┘
        │              │             │
        └──────────────┼─────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────────┐ ┌──▼──────┐ ┌───▼──────────┐
    │React Query │ │Zustand  │ │Sonner Toast  │
    │(Server)    │ │(UI)     │ │(Notifications)
    └───┬────────┘ └─────────┘ └───┬──────────┘
        │                           │
        └───────────────┬───────────┘
                        │
          ┌─────────────▼──────────────┐
          │   Supabase Client          │
          │  (Type-safe Database API)  │
          └─────────────┬──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼────┐   ┌─────▼──┐   ┌──────▼──┐
    │Database│   │Auth    │   │RLS      │
    │        │   │Service │   │Policies │
    └───┬────┘   └────────┘   └─────────┘
        │
    ┌───▼──────────────────────┐
    │ PostgreSQL Database       │
    │ (7 Tables, Indexed)       │
    └───────────────────────────┘
```

---

## Component Architecture

### Layered Component Model

```
┌────────────────────────────────────────────┐
│      Presentation Layer (UI Components)    │
│  • Pages (page.tsx, layout.tsx)           │
│  • Components (JobCard, Button, Card)     │
│  • Styling (Tailwind CSS)                 │
└─────────────────────┬──────────────────────┘
                      │
┌─────────────────────▼──────────────────────┐
│   Application Layer (Custom Hooks)         │
│  • useAuth() - Session & Profile          │
│  • useJobQualification() - Qualification  │
│  • useApplyToJob() - Mutation             │
│  • useApproveApplication() - Owner Action │
└─────────────────────┬──────────────────────┘
                      │
┌─────────────────────▼──────────────────────┐
│   Domain Layer (Business Logic Services)   │
│  • job-matching.ts - Qualification Logic  │
│  • job-application.service.ts - Workflow  │
│  • Pure Functions & Algorithms            │
└─────────────────────┬──────────────────────┘
                      │
┌─────────────────────▼──────────────────────┐
│   Data Layer (Database Client)             │
│  • Supabase Client Initialization         │
│  • Type-safe Database Operations          │
│  • Query Building & Execution             │
└─────────────────────┬──────────────────────┘
                      │
┌─────────────────────▼──────────────────────┐
│   Database Layer (PostgreSQL)              │
│  • Tables (profiles, jobs, applications)  │
│  • Indexes (query optimization)           │
│  • Row-Level Security (data isolation)    │
└────────────────────────────────────────────┘
```

### Component Dependency Graph

```
app/page.tsx (Job Feed)
    ├─ components/job-card.tsx
    │   └─ hooks/use-job-matching.ts (useApplyToJob)
    │       └─ lib/services/job-application.service.ts
    │           ├─ lib/job-matching.ts (evaluateWorkerQualification)
    │           └─ lib/supabase/client.ts
    │
    └─ hooks/use-job-matching.ts (useJobQualification)
        └─ lib/services/job-application.service.ts

app/layout.tsx (Root)
    ├─ components/providers.tsx
    │   ├─ React Query Provider
    │   └─ Sonner Toast Provider
    └─ hooks/use-auth.ts
        └─ lib/supabase/client.ts
```

---

## Data Flow

### Job Application Flow Diagram

```
┌──────────────────┐
│ Worker Views Job │
│   on Feed Page   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ JobCard Component Renders    │
│ ├─ Job details displayed    │
│ ├─ useJobQualification()    │──┐
│ │  fetches qualification    │  │
│ └─ Show "Instant Book" or  │  │
│   "Request to Book" button  │  │
└──────────────────────────────┘  │
         │                        │
         │ User clicks Apply      │
         │                        ▼
         │                ┌────────────────────┐
         │                │ evaluateWorker     │
         │                │ Qualification()    │
         │                │                    │
         │                │ Check 5 Criteria:  │
         │                │ 1. Language skill? │
         │                │ 2. Level OK?       │
         │                │ 3. Reliability OK? │
         │                │ 4. Not frozen?     │
         │                │ 5. Verified?       │
         │                │                    │
         │                │ Result: true/false │
         │                └────────┬───────────┘
         │                         │
         ▼                         ▼
┌──────────────────────────────────────────────┐
│ useApplyToJob().mutate(jobId, workerId)     │
│                                              │
│ Calls: applyToJob(jobId, workerId)          │
└──────────────────┬───────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
      SUCCESS            ERROR
         │                   │
         ▼                   ▼
    ┌─────────────┐   ┌────────────┐
    │ Create      │   │ Show Error │
    │Application  │   │ Toast      │
    │ Record      │   └────────────┘
    │             │
    │ is_instant_ │
    │ book = true │
    │ OR false    │
    └──────┬──────┘
           │
     ┌─────┴──────┐
     │            │
   YES            NO
 (true)         (false)
     │            │
     ▼            ▼
  ┌──────────────┐  ┌──────────┐
  │Generate QR   │  │Status:   │
  │Update Job    │  │pending   │
  │Auto-approved │  │Owner     │
  │Status: app   │  │approves  │
  │accepted      │  │later     │
  └──────┬───────┘  └────┬─────┘
         │               │
         └───────┬───────┘
                 │
                 ▼
        ┌──────────────────┐
        │Show Success      │
        │Toast & Redirect  │
        │to Job Details    │
        └──────────────────┘
```

### Data Synchronization Flow

```
1. Worker Opens App
   └─ useAuth() queries session
      └─ Supabase Auth returns session
         └─ useAuth() fetches profile
            └─ React Query caches profile data

2. Worker Views Job Feed
   └─ page.tsx fetches jobs
      └─ React Query caches job list
         └─ Maps jobs to JobCard components

3. Worker Applies to Job
   └─ useApplyToJob().mutate()
      └─ applyToJob() service
         ├─ Fetches worker profile + language_skills
         ├─ Fetches job details
         ├─ Calls evaluateWorkerQualification()
         ├─ Creates job_application record
         ├─ If instant book: generates QR, updates job count
         └─ Returns success/error

4. Cache Invalidation
   └─ onSuccess: invalidateQueries(['jobs', 'applications'])
      └─ React Query automatically refetches
         └─ UI updates with new data
```

---

## Service Layer

### Business Logic Services

#### 1. Job Matching Service (`lib/job-matching.ts`)

**Responsibility:** Evaluate worker qualification for jobs

**Key Functions:**

```typescript
evaluateWorkerQualification(
  worker: Profile,
  jobRequirements: {
    required_language: string
    required_language_level: number
    min_reliability_score: number
  }
): WorkerQualification
```

**Evaluation Criteria:**
```
Criterion 1: hasLanguageSkill
  └─ Query: language_skills WHERE user_id = ? AND language = ?
  └─ Result: boolean

Criterion 2: hasLanguageLevelVerified
  └─ Query: language_skills WHERE verified = true
  └─ Function: compareLanguageLevels(worker_level, required_level)
  └─ Result: boolean

Criterion 3: reliabilityScoreOk
  └─ Query: profiles.reliability_score >= job.min_reliability_score
  └─ Result: boolean

Criterion 4: accountNotFrozen
  └─ Function: isAccountActive(worker)
  └─ Logic: !is_account_frozen OR frozen_until < now()
  └─ Result: boolean

Criterion 5: isVerified
  └─ Query: profiles.is_verified = true
  └─ Result: boolean

Instant Book Eligible?
  └─ ALL 5 criteria must be true
  └─ Logic: AND operation
```

#### 2. Job Application Service (`lib/services/job-application.service.ts`)

**Responsibility:** Orchestrate job application workflow

**Key Functions:**

```typescript
async applyToJob(
  jobId: string,
  workerId: string
): Promise<ApplyToJobResult>
```

**Workflow:**
1. **Validate Job**
   - Check job exists
   - Check job status = 'open'
   - Check worker_count < max_workers

2. **Check Duplicate**
   - Query: job_applications WHERE job_id = ? AND worker_id = ?
   - Throw error if found

3. **Fetch Worker Data**
   - Query: profiles WHERE id = ?
   - Query: language_skills WHERE user_id = ?

4. **Evaluate Qualification**
   - Call: evaluateWorkerQualification()
   - Get: WorkerQualification object

5. **Create Application**
   - Insert: job_applications record
   - Set: status = 'approved' OR 'pending'
   - Set: is_instant_book = qualification.canInstantBook

6. **Generate QR (if Instant Book)**
   - Generate: QR token (mock or actual QR library)
   - Update: job_applications.checkin_qr_code
   - Update: jobs.current_workers += 1

7. **Return Result**
   ```typescript
   {
     success: boolean,
     application: JobApplication,
     message: "Applied successfully",
     feedbackMessage?: "..."
   }
   ```

---

## State Management

### React Query Architecture

**Purpose:** Server state synchronization and caching

**Cache Strategy:**

```typescript
// Job Feed - fetched once, stale after 5 minutes
useQuery({
  queryKey: ['jobs'],
  queryFn: fetchJobs,
  staleTime: 5 * 60 * 1000,     // 5 minutes
  gcTime: 10 * 60 * 1000,        // 10 minutes (garbage collect)
})

// User Profile - invalidated on auth changes
useQuery({
  queryKey: ['user-profile', userId],
  queryFn: () => fetchProfile(userId),
  enabled: !!userId,              // Only fetch if userId exists
})

// Job Qualification - invalidated on application
useQuery({
  queryKey: ['job-qualification', jobId, workerId],
  queryFn: () => getWorkerQualificationForJob(jobId, workerId),
})
```

**Cache Invalidation:**

```typescript
// On successful application
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['jobs'] });
  queryClient.invalidateQueries({ queryKey: ['job-qualification'] });
  toast.success('Applied successfully');
}

// Manual invalidation in component
const { mutate } = useApplyToJob();
const queryClient = useQueryClient();

const handleApply = async () => {
  const result = await mutate();
  if (result.success) {
    await queryClient.refetchQueries({ queryKey: ['jobs'] });
  }
};
```

### Global State (Planned - Zustand)

**Purpose:** UI state that doesn't need server sync

```typescript
// Would store:
// - UI preferences (theme, language)
// - Temporary UI state (modal open/close)
// - Pagination state
// - Filter selections
```

---

## Database Architecture

### Entity-Relationship Diagram

```
┌─────────────────┐
│    profiles     │  (Users: Workers + Owners)
├─────────────────┤
│ id (PK)         │
│ role            │  'worker' | 'owner'
│ phone           │
│ name            │
│ reliability_    │
│   score         │  0-100, starts at 100
│ is_account_     │
│   frozen        │
│ frozen_until    │
│ is_verified     │
│ intro_video_url │
│ created_at      │
└────────┬────────┘
         │ (1:N)
         │
    ┌────▼───────────────┐
    │  language_skills   │
    ├────────────────────┤
    │ id (PK)            │
    │ user_id (FK)       │───────┐
    │ language           │       │
    │ level              │       │
    │ verification_      │       │
    │   status           │       │
    │ certificate_       │       │
    │   url              │       │
    │ expires_at         │       │
    │ created_at         │       │
    └────────────────────┘       │
                                 │
         ┌───────────────────────┘
         │
         │ (1:N)
    ┌────▼──────────┐
    │     jobs      │  (Job Postings)
    ├───────────────┤
    │ id (PK)       │
    │ owner_id (FK) │─ references profiles
    │ title         │
    │ description   │
    │ required_     │
    │   language    │
    │ required_     │
    │   language_   │
    │   level       │
    │ min_          │
    │   reliability │
    │   _score      │
    │ shift_date    │
    │ shift_time_   │
    │   start       │
    │ shift_time_   │
    │   end         │
    │ pay_rate      │
    │ location      │
    │ status        │ 'open' | 'closed' | 'filled'
    │ current_      │
    │   workers     │
    │ max_workers   │
    │ created_at    │
    └────┬─────────┘
         │ (1:N)
         │
    ┌────▼──────────────────┐
    │  job_applications     │  (Applications)
    ├───────────────────────┤
    │ id (PK)               │
    │ job_id (FK)           │
    │ worker_id (FK)        │
    │ status                │  'pending'|'approved'|'rejected'|'completed'
    │ is_instant_book       │  boolean
    │ checkin_qr_code       │  string (or QR data)
    │ message_from_worker   │
    │ created_at            │
    │ updated_at            │
    └────┬──────────────────┘
         │ (1:N)
         │
    ┌────▼────────────────┐
    │     checkins        │  (Check-in/out Records)
    ├─────────────────────┤
    │ id (PK)             │
    │ application_id (FK) │
    │ check_in_time       │
    │ check_out_time      │
    │ location            │
    │ latitude            │
    │ longitude           │
    │ status              │ 'on_time'|'late'|'absent'
    │ created_at          │
    └─────────────────────┘


Other Tables:
┌─────────────────────────┐    ┌──────────────────────┐
│ reliability_history     │    │wallet_transactions   │
├─────────────────────────┤    ├──────────────────────┤
│ id (PK)                 │    │ id (PK)              │
│ worker_id (FK)          │    │ user_id (FK)         │
│ score_change            │    │ amount               │
│ reason                  │    │ type                 │
│ created_at              │    │ status               │
└─────────────────────────┘    │ created_at           │
                                └──────────────────────┘
```

### Indexing Strategy

**Query Performance Indexes:**

```sql
-- Job listing queries
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_owner_id ON jobs(owner_id);

-- Profile lookups
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Language skills queries
CREATE INDEX idx_language_skills_user_id ON language_skills(user_id);
CREATE INDEX idx_language_skills_language ON language_skills(language);
CREATE INDEX idx_language_skills_verification ON language_skills(verification_status);

-- Application lookups
CREATE INDEX idx_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_applications_worker_id ON job_applications(worker_id);
CREATE INDEX idx_applications_status ON job_applications(status);

-- Check-in queries
CREATE INDEX idx_checkins_application_id ON checkins(application_id);
CREATE INDEX idx_checkins_worker_id ON checkins(worker_id);

-- Reliability history
CREATE INDEX idx_reliability_worker_id ON reliability_history(worker_id);

-- Wallet transactions
CREATE INDEX idx_wallet_user_id ON wallet_transactions(user_id);
```

---

## Security Architecture

### Authentication Flow

```
1. User Visits App
   └─ useAuth() hook runs
      └─ Checks Supabase Session
         ├─ Session found: Load user profile
         └─ No session: Show login

2. User Enters Phone Number
   └─ Supabase Auth sends OTP
      └─ User enters OTP
         └─ Supabase verifies
            └─ Creates session JWT
               └─ Session stored in cookies
                  └─ useAuth() refetches user

3. Subsequent Requests
   └─ Supabase client includes JWT in headers
      └─ Supabase backend validates JWT
         └─ RLS policies check user ownership
            └─ Return only authorized data
```

### Row-Level Security (RLS)

**Strategy:** Users can only access their own data

```sql
-- Profiles: Users see own profile only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Jobs: Everyone can view, owners can create/update own
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view open jobs"
ON jobs FOR SELECT
USING (status = 'open');

CREATE POLICY "Owners can manage own jobs"
ON jobs FOR ALL
USING (auth.uid() = owner_id);

-- Job Applications: Users see own applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers see own applications"
ON job_applications FOR SELECT
USING (auth.uid() = worker_id);

CREATE POLICY "Owners see applications for their jobs"
ON job_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_applications.job_id
    AND jobs.owner_id = auth.uid()
  )
);
```

### Data Protection

- **HTTPS Only:** All communication encrypted in transit
- **Database Encryption:** PostgreSQL encryption at rest (Supabase handles)
- **Sensitive Data:** Phone numbers, location data, payment info protected
- **Session Management:** JWT tokens with expiry
- **API Rate Limiting:** Planned (100 req/min per user)

---

## Deployment Architecture

### Development Environment

```
Local Machine
├─ npm run dev
│  └─ Next.js dev server (localhost:3000)
│     └─ Hot reload on file changes
├─ Environment: .env.local
└─ Database: Supabase cloud (dev project)
```

### Production Environment

```
GitHub Repository
    ↓
Vercel CI/CD Pipeline
    ├─ npm install
    ├─ npm run build
    ├─ npm run lint
    ├─ Deploy to Vercel Edge
    └─ Automatic deployment on push to main

Production URL: https://tapy.vercel.app
    ├─ Vercel Edge Functions (API Routes)
    ├─ Vercel Static Hosting (Assets)
    └─ Vercel Analytics

Supabase Cloud (Production)
    ├─ PostgreSQL Database
    ├─ Auth Service
    ├─ Real-time Subscriptions
    └─ Backup & Recovery
```

### Environment Variables

**Required in Vercel Dashboard:**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_APP_URL
```

---

## Scalability Design

### Horizontal Scaling

**Current Bottlenecks & Solutions:**

1. **Frontend Load**
   - Solution: Vercel auto-scaling, global edge functions
   - CDN: Vercel's edge network (automatic)
   - Cache: Static generation for job listings

2. **Database Connections**
   - Solution: Supabase connection pooling
   - Cache: React Query + Redis (planned)
   - Query optimization: Indexes on all FK columns

3. **Real-time Updates**
   - Solution: Supabase Realtime (WebSocket)
   - Alternative: Polling with React Query

4. **Large File Storage**
   - Solution: Supabase Storage (S3 compatible)
   - Use for: Certificate uploads, profile images, QR codes

### Database Optimization Roadmap

**Phase 1 (Current):**
- Normalized schema (7 tables)
- Indexes on all queries
- RLS for security

**Phase 2 (Growth):**
- Materialized views for job feed
- Caching layer (Redis)
- Connection pooling

**Phase 3 (Scale):**
- Read replicas for reporting
- Sharding by region (HCMC, Hanoi, etc.)
- Elasticsearch for full-text search

### Caching Strategy

```
Client Browser
├─ Service Worker (PWA)
├─ Local Storage
├─ HTTP Cache
└─ React Query Memory Cache

Application Layer
├─ React Query cache (5 min stale)
├─ Zustand global state
└─ Component state

Server Cache (Planned)
├─ Redis (job listings)
├─ CDN (static assets)
└─ Vercel ISR (incremental static regeneration)
```

---

## API Contract

### REST API Endpoints (Current)

#### Job Operations

```
GET /api/jobs
  Query: status=open, language=ja, page=1
  Response: { jobs: Job[], total: number, page: number }

POST /api/job-applications
  Body: { job_id: string, worker_id: string }
  Response: { success: boolean, application: JobApplication }
```

#### User Operations

```
GET /api/auth/session
  Response: { session: Session | null }

GET /api/profile/:userId
  Response: { profile: Profile }

GET /api/workers/:workerId/qualification/:jobId
  Response: { qualification: WorkerQualification, feedback: string }
```

### Webhook Events (Planned)

```
POST /webhooks/job-completed
  Trigger: Job completed
  Payload: { application_id, worker_id, job_id, completion_time }

POST /webhooks/application-approved
  Trigger: Owner approves application
  Payload: { application_id, job_id, worker_id, checkin_qr_code }

POST /webhooks/payment-received
  Trigger: Payment processed
  Payload: { transaction_id, user_id, amount, status }
```

---

## Monitoring & Observability

### Metrics to Track

1. **Performance Metrics**
   - Page load time: <2s target
   - API response time: <200ms target
   - Database query time: <50ms target

2. **Business Metrics**
   - Daily active users (DAU)
   - Weekly active users (WAU)
   - Instant Book success rate
   - Job completion rate

3. **Technical Metrics**
   - Error rate: <1% target
   - Uptime: 99.5% target
   - API availability: 99.9% target

### Logging & Debugging

```typescript
// Structured logging
console.log('Event', {
  timestamp: new Date().toISOString(),
  event: 'job_application',
  worker_id: workerId,
  job_id: jobId,
  status: 'success' | 'error',
  duration_ms: 123,
});

// Error tracking (Sentry integration - planned)
import * as Sentry from "@sentry/nextjs";

try {
  await applyToJob(jobId, workerId);
} catch (error) {
  Sentry.captureException(error);
}
```

---

## Future Architecture Enhancements

### Phase 2: Advanced Features
- WebSocket real-time notifications
- Elasticsearch for job search
- Redis caching layer
- Stripe/MoMo payment integration
- Admin dashboard

### Phase 3: Microservices
- Authentication service (separate)
- Payment service (PCI-DSS compliance)
- Notification service (push/email/SMS)
- Analytics service (data warehouse)

### Phase 4: AI/ML Features
- Job recommendation engine
- Worker matching optimization
- Fraud detection
- Salary prediction model

