# Tapy App: Architecture & Data Flow Diagrams

## Component Hierarchy

```
RootLayout (app/layout.tsx)
├── Metadata Configuration
├── Providers (components/providers.tsx)
│   └── QueryClientProvider (React Query)
├── Children Pages
│   └── HomePage (app/page.tsx) 'use client'
│       └── JobCard[] (components/job-card.tsx)
│           ├── Button (components/ui/button.tsx)
│           └── Icons (lucide-react)
└── Toaster (sonner)
```

## Data Flow Architecture

### Job Discovery & Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION LAYER                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HomePage                                            │   │
│  │  - useAuth() → Get current user                      │   │
│  │  - useQuery('jobs') → Fetch open jobs               │   │
│  │  - Display JobCard[] filtered & sorted              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JobCard (Per Job)                                   │   │
│  │  ├─ useAuth() → Extract workerId                     │   │
│  │  ├─ useJobQualification() → Check eligibility       │   │
│  │  └─ onClick: useApplyToJob().mutate()                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  applyToJob(jobId, workerId)                         │   │
│  │  1. Fetch job details from Supabase                 │   │
│  │  2. Check job status (must be 'open')               │   │
│  │  3. Prevent duplicate applications                   │   │
│  │  4. Fetch worker profile + language skills           │   │
│  │  5. Call evaluateWorkerQualification()              │   │
│  │  6. Create job_applications record                   │   │
│  │  7. If Instant Book:                                 │   │
│  │     - Update job workers count                       │   │
│  │     - Generate QR code                               │   │
│  │  8. Return result with success/message               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  evaluateWorkerQualification(worker, jobRequirements)│   │
│  │  Returns qualification object with flags:            │   │
│  │  - hasRequiredLanguage                               │   │
│  │  - meetsLanguageLevel                                │   │
│  │  - meetsReliabilityScore                             │   │
│  │  - isAccountActive                                   │   │
│  │  - isVerified                                        │   │
│  │  - qualifiesForInstantBook (all must be true)        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (Supabase)                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  SELECT * FROM jobs      │  │  SELECT * FROM profiles  │ │
│  │  WHERE status = 'open'   │  │  WITH language_skills    │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │  INSERT job_applications │  │  UPDATE jobs             │ │
│  │  (approved/pending)      │  │  (current_workers++)     │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Job Qualification Decision Tree

```
Worker Applies to Job
     ↓
Check Job Status
├─ OPEN? ─NO→ ❌ Reject (Job not accepting)
└─ YES ↓
    Check Duplicate Application
    ├─ EXISTS? ─YES→ ❌ Reject (Already applied)
    └─ NO ↓
        Fetch Worker Profile
        ├─ NOT FOUND? ─YES→ ❌ Reject (No profile)
        └─ FOUND ↓
            Evaluate Qualification (ALL must pass):
            ├─ [1] Has Required Language?
            │   ├─ NO→ ⚠️ Missing language
            │   └─ YES ↓
            │       [2] Language Level Sufficient?
            │       ├─ NO→ ⚠️ Low level
            │       └─ YES ↓
            │           [3] Reliability Score?
            │           ├─ NO→ ⚠️ Low reliability
            │           └─ YES ↓
            │               [4] Account Active?
            │               ├─ NO→ ⚠️ Account frozen
            │               └─ YES ↓
            │                   [5] Verified (Has Video)?
            │                   ├─ NO→ ⚠️ Not verified
            │                   └─ YES ↓
            │                       ✅ ALL PASS
            │
            ALL PASS? ─YES→ ✨ INSTANT BOOK
                            ├─ Create application (approved)
                            ├─ Generate QR code
                            ├─ Update job workers count
                            └─ Return success
            │
            ├─NO→ REQUEST TO BOOK
                  ├─ Create application (pending)
                  ├─ Wait for owner approval
                  └─ Return pending status
```

## React Query Integration

### Query Dependency Graph

```
Session Query
  ├─ Enabled: Always
  └─ Key: ['session']
       ↓
       User Profile Query
       ├─ Enabled: if session exists
       ├─ Key: ['user-profile', userId]
       └─ Dependencies: Session ID
            ↓
            Job Qualification Query
            ├─ Enabled: if both jobId & workerId
            ├─ Key: ['job-qualification', jobId, workerId]
            └─ Dependencies: WorkerId from profile

Jobs Query
  ├─ Enabled: Always
  ├─ Key: ['jobs']
  ├─ StaleTime: 60000ms (1 minute)
  └─ Refetch: OnWindowFocus disabled
       ↓ (on application success)
       ├─ Invalidate ['jobs']
       ├─ Invalidate ['job-applications']
       └─ Invalidate ['job-qualification']
```

### Cache Invalidation Strategy

```
applyToJob() Success
     ↓
queryClient.invalidateQueries({
  queryKey: ['jobs']              // Refresh job list
})
queryClient.invalidateQueries({
  queryKey: ['job-applications']  // Refresh user's apps
})
queryClient.invalidateQueries({
  queryKey: ['job-qualification'] // Refresh eligibility
})
     ↓
React Query auto-refetch → Component re-renders
```

## File Dependencies

```
app/layout.tsx
├─ components/providers.tsx
├─ app/globals.css
└─ sonner (toast)

app/page.tsx
├─ components/job-card.tsx
├─ lib/supabase/client.ts
├─ types/database.types.ts
└─ @tanstack/react-query

components/job-card.tsx
├─ components/ui/button.tsx
├─ hooks/use-auth.ts
├─ hooks/use-job-matching.ts
├─ lib/job-matching.ts
├─ types/database.types.ts
└─ lucide-react (icons)

components/ui/button.tsx
├─ lib/utils.ts
└─ class-variance-authority (CVA)

components/ui/card.tsx
└─ lib/utils.ts

hooks/use-auth.ts
├─ @tanstack/react-query
├─ lib/supabase/client.ts
└─ types/database.types.ts

hooks/use-job-matching.ts
├─ @tanstack/react-query
├─ lib/services/job-application.service.ts
└─ sonner (toast)

lib/supabase/client.ts
├─ @supabase/auth-helpers-nextjs
└─ types/database.types.ts

lib/job-matching.ts
└─ types/database.types.ts

lib/services/job-application.service.ts
├─ lib/supabase/client.ts
├─ lib/job-matching.ts
└─ types/database.types.ts

lib/utils.ts
├─ clsx
└─ tailwind-merge

types/database.types.ts (no dependencies)
```

## TypeScript Type Flow

```
Database (Supabase types)
    ├─ Profile interface
    │  └─ Used in: useAuth(), job-matching.ts
    ├─ Job interface
    │  └─ Used in: app/page.tsx, job-card.tsx
    ├─ JobApplication interface
    │  └─ Used in: job-application.service.ts
    └─ LanguageSkill interface
       └─ Used in: evaluateWorkerQualification()

WorkerProfile (typed in lib/job-matching.ts)
    ├─ reliability_score
    ├─ is_account_frozen, frozen_until
    ├─ is_verified
    └─ language_skills[]

JobRequirements (typed in lib/job-matching.ts)
    ├─ required_language (LanguageType)
    ├─ required_language_level (LanguageLevel)
    └─ min_reliability_score

WorkerQualification (return type)
    ├─ hasRequiredLanguage: boolean
    ├─ meetsLanguageLevel: boolean
    ├─ meetsReliabilityScore: boolean
    ├─ isAccountActive: boolean
    ├─ isVerified: boolean
    └─ qualifiesForInstantBook: boolean
```

## Component Rendering Flow (with Hooks)

```
<HomePage />
    ↓
useAuth()
├─ Session Query: Gets Supabase session
└─ User Query: Depends on session

useQuery('jobs')
├─ Fetches from 'jobs' table
├─ Filters: status = 'open'
└─ Sort: created_at DESC

map(job) → <JobCard job={job} />
    ↓
<JobCard>
    ├─ useAuth() [DUPLICATE - reuses cache]
    │  └─ Gets workerId from user profile
    ├─ useJobQualification(jobId, workerId)
    │  └─ Calls: getWorkerQualificationForJob()
    │     ├─ Fetches job requirements
    │     ├─ Fetches worker profile + skills
    │     └─ Returns qualification & feedback
    └─ useApplyToJob() [Mutation]
       └─ On button click: mutate(jobId, workerId)
          ├─ Calls: applyToJob()
          ├─ Calls: evaluateWorkerQualification()
          ├─ Creates DB record
          └─ Invalidates queries
```

## Feature: Instant Book vs Request

```
┌──────────────────────────────────────────────────────────┐
│              INSTANT BOOK CONDITIONS                      │
├──────────────────────────────────────────────────────────┤
│ ✅ Worker has required language                          │
│ ✅ Language level meets requirement (VERIFIED)           │
│ ✅ Reliability score >= job minimum                      │
│ ✅ Account not frozen or freeze expired                  │
│ ✅ Profile verified (has intro video)                    │
├──────────────────────────────────────────────────────────┤
│ Result: Application auto-approved                        │
│ Action: Generate QR code immediately                     │
│ Status: is_instant_book = true                           │
│ Button: Green "✨ ĐẶT CHỖ NGAY" (Instant Book)          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              REQUEST TO BOOK (PENDING)                    │
├──────────────────────────────────────────────────────────┤
│ Any condition above fails:                               │
│ ❌ Language requirement not met                          │
│ ❌ Language not verified                                 │
│ ❌ Reliability score too low                             │
│ ❌ Account frozen                                        │
│ ❌ Profile not verified                                  │
├──────────────────────────────────────────────────────────┤
│ Result: Application pending owner review                 │
│ Status: is_instant_book = false, status = 'pending'     │
│ Button: Blue "📝 GỬI YÊU CẦU" (Send Request)            │
│ Feedback: Shows reason(s) why not instant book           │
└──────────────────────────────────────────────────────────┘
```

## Reliability Score System

```
Worker Profile
    │
    ├─ Initial Score: 100
    │
    ├─ Job Completion
    │  └─ +1 point
    │
    ├─ Late Check-in
    │  └─ -2 points
    │
    ├─ No-show
    │  └─ -20 points + Account Freeze
    │
    └─ Check-in Score
       └─ score >= min_required_score
          ├─ YES: Can apply for jobs
          └─ NO: Need to improve first

Account Frozen Logic
    │
    ├─ is_account_frozen = true
    ├─ frozen_until = expiry timestamp
    │
    └─ isAccountActive() function
       ├─ NOT FROZEN? → return true
       ├─ FROZEN but expired? → return true
       └─ FROZEN & valid? → return false
          └─ Block job applications
```

## Language Level Hierarchy

```
LANGUAGE_LEVEL_WEIGHT mapping:

Japanese (JLPT)         Korean (TOPIK)          English (CEFR)
├─ beginner: 0          ├─ (none: 0)            ├─ (none: 0)
├─ N5: 1                ├─ topik_1: 1           ├─ A1: 1
├─ N4: 2                ├─ topik_2: 2           ├─ A2: 2
├─ N3: 3                ├─ topik_3: 3           ├─ B1: 3
├─ N2: 4                ├─ topik_4: 4           ├─ B2: 4
└─ N1: 5                ├─ topik_5: 5           ├─ C1: 5
                        └─ topik_6: 6           └─ C2: 6

Comparison: workerWeight >= requiredWeight
Example: Worker with N3 (3) can apply to job requiring N4 (2)
```

---

## API Surface

### Exported Functions

```
lib/job-matching.ts
├─ evaluateWorkerQualification(worker, requirements)
│  └─ returns: WorkerQualification
└─ getQualificationFeedback(qualification)
   └─ returns: string (Vietnamese message)

lib/services/job-application.service.ts
├─ applyToJob(jobId, workerId)
│  └─ returns: Promise<ApplyToJobResult>
├─ getWorkerQualificationForJob(jobId, workerId)
│  └─ returns: Promise<{qualification, feedback, canApply}>
└─ approveApplication(applicationId, ownerId)
   └─ returns: Promise<{success, message}>

hooks/use-auth.ts
└─ useAuth()
   └─ returns: {session, user, isLoading}

hooks/use-job-matching.ts
├─ useJobQualification(jobId, workerId)
│  └─ returns: Query<{qualification, feedback, canApply}>
├─ useApplyToJob()
│  └─ returns: Mutation<void, error, {jobId, workerId}>
└─ useApproveApplication()
   └─ returns: Mutation<void, error, {applicationId, ownerId}>
```

---

## Supabase Table Relationships

```
profiles (users)
    ├─ id (PK)
    ├─ phone_number (OTP login)
    ├─ role: 'worker' | 'owner'
    ├─ reliability_score
    ├─ is_verified
    └─ 1:N → language_skills

language_skills
    ├─ id (PK)
    ├─ user_id (FK → profiles)
    ├─ language: japanese | korean | english
    ├─ level: N5-N1 | TOPIK 1-6 | A1-C2
    ├─ verification_status: pending | verified | rejected
    └─ verified_by, verified_at

jobs
    ├─ id (PK)
    ├─ owner_id (FK → profiles)
    ├─ required_language
    ├─ required_language_level
    ├─ min_reliability_score
    ├─ status: open | filled | completed | cancelled
    └─ current_workers, max_workers

job_applications (junction table)
    ├─ id (PK)
    ├─ job_id (FK → jobs)
    ├─ worker_id (FK → profiles)
    ├─ is_instant_book: boolean
    ├─ status: pending | approved | rejected | completed | no_show
    └─ timestamps: applied_at, approved_at, rejected_at, contract_signed_at
```
