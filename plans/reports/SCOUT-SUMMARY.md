# Scout Report Summary - Lib & Hooks Exploration
**Generated:** 2026-01-06 | **Project:** Tapy (Just-in-Time Recruitment Platform)

---

## Quick Overview

**Scope:** Complete analysis of `/lib` and `/hooks` directories
**Total Files:** 6 TypeScript files
**Total Lines:** ~605 lines of code
**Key Finding:** Clean, well-structured modularity with clear separation of concerns

---

## File Listing with Purposes

### Library Files (4)

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `lib/supabase/client.ts` | 7 | Supabase client factory | `createClient()` |
| `lib/job-matching.ts` | 176 | Job qualification algorithm | `evaluateWorkerQualification()`, `getQualificationFeedback()` |
| `lib/services/job-application.service.ts` | 310 | Job application workflow | `applyToJob()`, `getWorkerQualificationForJob()`, `approveApplication()` |
| `lib/utils.ts` | 8 | CSS utility helpers | `cn()` |

### Hook Files (2)

| File | Lines | Purpose | Key Exports |
|------|-------|---------|-------------|
| `hooks/use-auth.ts` | 39 | Auth & profile management | `useAuth()` |
| `hooks/use-job-matching.ts` | 65 | Job mutations & queries | `useJobQualification()`, `useApplyToJob()`, `useApproveApplication()` |

---

## Core Functionality Breakdown

### 1. Database & API Integration
**Files:** `lib/supabase/client.ts`
- Typed Supabase client for type-safe database operations
- Used by all other services

### 2. Job Matching Algorithm
**Files:** `lib/job-matching.ts`
- Language level comparison across JLPT, TOPIK, CEFR
- 5-criteria qualification evaluation:
  1. Has required language skill
  2. Language level verified and meets requirement
  3. Reliability score meets minimum
  4. Account not frozen
  5. User verified (intro video)
- Instant Book: ALL criteria must pass (AND logic)
- Provides human-readable feedback in Vietnamese

### 3. Job Application Workflow
**Files:** `lib/services/job-application.service.ts`
- `applyToJob()` - Main application function
  - Validates job & prevents duplicates
  - Evaluates worker qualification
  - Creates application (auto-approved or pending)
  - Generates check-in QR code if instant book
  - Updates job worker count
- `getWorkerQualificationForJob()` - Display qualification status
- `approveApplication()` - Owner approval workflow

### 4. Authentication Management
**Files:** `hooks/use-auth.ts`
- Uses React Query for caching
- Manages session state
- Lazy loads user profile
- Provides loading indicator

### 5. Job Application Mutations
**Files:** `hooks/use-job-matching.ts`
- `useJobQualification()` - Query hook for qualification status
- `useApplyToJob()` - Mutation for job application
- `useApproveApplication()` - Mutation for owner approval
- Automatic cache invalidation
- Toast notifications for user feedback

---

## Key Architecture Patterns

### Layered Design
```
UI Components
    ↓
React Hooks (use-auth, use-job-matching)
    ↓
Business Logic Services (job-application.service)
    ↓
Pure Functions & Algorithms (job-matching)
    ↓
Database Client (supabase/client)
    ↓
Supabase PostgreSQL
```

### State Management Strategy
- **Server State:** React Query (session, profiles, qualifications)
- **UI State:** Component state (not visible in lib/hooks)
- **Global State:** Zustand (mentioned in README, not yet implemented)

### Type Safety
- Full TypeScript coverage
- Typed Supabase client
- Interface contracts for all functions
- Database types imported from `/types/database.types`

---

## Database Tables Referenced

| Table | Purpose | Fields Used |
|-------|---------|-------------|
| `profiles` | User profiles | reliability_score, is_account_frozen, is_verified, frozen_until |
| `language_skills` | Language proficiencies | language, level, verification_status |
| `jobs` | Job postings | required_language, required_language_level, min_reliability_score, status, current_workers, max_workers |
| `job_applications` | Applications | job_id, worker_id, status, is_instant_book, checkin_qr_code, timestamps |

---

## Integration Flow Example

```
Worker Views Job
    ↓
useJobQualification(jobId, workerId)
    ↓
evaluateWorkerQualification()
    ↓
✓ All 5 criteria met?
    ↓ YES → "Instant Book"
    ↓ NO → "Request to Book"
    ↓
Worker clicks Apply
    ↓
useApplyToJob().mutate()
    ↓
applyToJob() service
    ↓
Create application (status: approved/pending)
    ↓
If instant book:
  - Generate QR code
  - Update job workers count
  - Auto-contract signing
    ↓
Show toast notification
```

---

## Production Readiness Status

### Implemented & Production-Ready
- [x] Supabase client setup
- [x] Type-safe database operations
- [x] Job matching algorithm
- [x] Application workflow
- [x] Authentication management
- [x] Error handling
- [x] Cache invalidation
- [x] User feedback system

### Not Yet Implemented / Mock
- [ ] Actual QR code generation (returns token format)
- [ ] Geolocation verification (100m radius check)
- [ ] Payment/wallet integration
- [ ] Zustand store setup
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Push notifications

---

## Important Business Rules

### Instant Book Eligibility
Worker must meet ALL requirements:
- Possess the required language (verified)
- Language level >= job requirement
- Reliability score >= job minimum
- Account not frozen
- Identity verified (intro video)

### Reliability Scoring
- Initial: 100 points
- Late check-in: -2 points
- No-show: -20 points + account freeze
- Completion: +1 point

### Language Systems
- Japanese: JLPT (N5-N1)
- Korean: TOPIK (1-6)
- English: CEFR (A1-C2)
- Weighted equally (N5=TOPIK_1=A1=1 point)

---

## Code Quality Observations

### Strengths
- Clear function documentation
- Proper error handling with try-catch
- Type safety throughout
- Clean separation of concerns
- Reusable service layer
- Proper React Query patterns
- Vietnamese error messages for local market

### Areas for Enhancement
- Add JSDoc comments to exported functions
- Add unit tests (not yet present in files)
- Implement actual QR code generation
- Add input validation layer
- Add rate limiting

---

## Quick Import Reference

```typescript
// Database
import { createClient } from '@/lib/supabase/client';

// Business Logic
import { 
  evaluateWorkerQualification, 
  getQualificationFeedback 
} from '@/lib/job-matching';

import { 
  applyToJob, 
  getWorkerQualificationForJob, 
  approveApplication 
} from '@/lib/services/job-application.service';

// UI Helpers
import { cn } from '@/lib/utils';

// Hooks
import { useAuth } from '@/hooks/use-auth';
import { 
  useJobQualification, 
  useApplyToJob, 
  useApproveApplication 
} from '@/hooks/use-job-matching';
```

---

## Resources Generated

1. **scout-external-260106-2356-lib-hooks-exploration.md**
   - Comprehensive 15-section analysis
   - Detailed file-by-file breakdown
   - Architecture patterns
   - Production readiness checklist

2. **scout-external-260106-2356-files-index.md**
   - Quick reference index
   - Import patterns
   - Code metrics

3. **scout-external-260106-2356-code-snippets.md**
   - 7 key code implementations
   - Usage patterns
   - Integration examples

4. **SCOUT-SUMMARY.md** (this file)
   - Executive overview
   - Quick lookup reference

---

**Report Complete**
Location: `/Users/tommac/Desktop/Solo Builder/Tapi-app/plans/reports/`
