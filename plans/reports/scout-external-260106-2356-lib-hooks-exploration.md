# Lib & Hooks Directory Exploration Report
**Date:** 2026-01-06 | **Scope:** lib/ and hooks/ directories | **Project:** Tapy (Just-in-Time Recruitment Platform)

---

## Executive Summary

The Tapy application uses a clean, modular architecture for utility functions and custom React hooks. The codebase contains **4 core library files** and **2 custom hooks**, organized by responsibility. All files leverage Supabase for database operations and React Query for state management.

---

## Directory Structure

```
lib/
├── job-matching.ts              # Core job matching algorithm
├── utils.ts                     # Tailwind CSS utility helpers
├── services/
│   └── job-application.service.ts   # Job application logic with Instant Book
└── supabase/
    └── client.ts                # Supabase client initialization

hooks/
├── use-auth.ts                  # Authentication hook with session management
└── use-job-matching.ts          # Job matching and application hooks
```

---

## Core Files Overview

### **LIB DIRECTORY**

#### 1. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/supabase/client.ts`
**Purpose:** Supabase client initialization
**Type:** Database/API Client Configuration
**Key Details:**
- Creates a typed Supabase client component
- Uses `createClientComponentClient` from Supabase auth helpers
- Typed with Database schema types
- Singleton pattern for consistent client usage across app

**Exports:**
- `createClient()` - Function to get Supabase client instance

---

#### 2. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/job-matching.ts`
**Purpose:** Core job matching logic for Instant Book vs Request to Book
**Type:** Shared Business Logic / Algorithm
**Key Details:**
- Implements language level comparison system for multiple languages:
  - Japanese (JLPT): N5-N1 (levels 1-5)
  - Korean (TOPIK): 1-6 (levels 1-6)
  - English (CEFR): A1-C2 (levels 1-6)
- Language level weighting system for fair comparison
- Account freeze logic with expiration checking
- Multi-criteria worker qualification evaluation

**Key Functions:**
- `evaluateWorkerQualification(worker, jobRequirements)` - Main evaluation function
  - Returns: `WorkerQualification` with 6 boolean criteria
  - Criteria: language match, level match, reliability score, account active, verification status, instant book eligibility
- `getQualificationFeedback(qualification)` - Human-readable feedback messages (Vietnamese)
- `compareLanguageLevels(workerLevel, requiredLevel, language)` - Language level comparison
- `isAccountActive(worker)` - Account freeze status check

**Qualification Criteria for Instant Book:**
1. Has required language skill
2. Meets language level requirement (verified)
3. Reliability score >= minimum required
4. Account not frozen (or frozen period expired)
5. Is verified (has intro video)

---

#### 3. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/services/job-application.service.ts`
**Purpose:** Job application handling with Instant Book logic
**Type:** Business Logic Service
**Key Details:**
- Orchestrates job application workflow
- Integrates job matching evaluation
- Handles QR code generation for check-in (mock implementation)
- Manages worker qualification feedback
- Owner approval workflow

**Key Functions:**
- `applyToJob(jobId, workerId)` - Main application function
  - Validates job status, prevents duplicate applications
  - Fetches worker profile with language skills
  - Evaluates qualification using `evaluateWorkerQualification`
  - Creates application record (approved or pending)
  - Generates QR code and updates job worker count if instant book
  - Returns: `ApplyToJobResult` with success status, application data, and message

- `getWorkerQualificationForJob(jobId, workerId)` - Get qualification status for job view
  - Returns: Qualification object, feedback message, and canApply flag
  - Used for displaying eligibility info to workers

- `approveApplication(applicationId, ownerId)` - Owner approval workflow
  - Verifies owner has permission to approve
  - Updates application status
  - Generates and stores QR code
  - Returns: Success message

**Mock/Production Items:**
- QR code generation currently returns token format: `QR-{applicationId}-{timestamp}`
- Ready for actual QR library integration

---

#### 4. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/utils.ts`
**Purpose:** Tailwind CSS utility helpers
**Type:** UI Helper Functions
**Key Details:**
- Single utility function for combining CSS classes
- Uses `clsx` for conditional classes
- Uses `tailwind-merge` to handle Tailwind conflicts
- Standard pattern in Shadcn/UI projects

**Exports:**
- `cn(...inputs)` - Merge and deduplicate Tailwind classes

---

### **HOOKS DIRECTORY**

#### 1. `/Users/tommac/Desktop/Solo Builder/Tapi-app/hooks/use-auth.ts`
**Purpose:** Authentication and user profile management
**Type:** Custom React Hook
**Dependencies:** React Query, Supabase
**Key Details:**
- Uses React Query for session and user caching
- Manages session state with automatic dependency tracking
- Lazy loads user profile only when session exists
- Provides loading state

**Returns Object:**
```typescript
{
  session: Session | null      // Current auth session
  user: Profile | null         // User profile from database
  isLoading: boolean           // Loading indicator
}
```

**Behavior:**
- Fetches session from Supabase auth
- Once session exists, fetches profile from `profiles` table
- Uses cache keys: `['session']`, `['user-profile', userId]`
- Enables/disables profile query based on session existence

---

#### 2. `/Users/tommac/Desktop/Solo Builder/Tapi-app/hooks/use-job-matching.ts`
**Purpose:** Job matching and application mutations
**Type:** Custom React Hook (Composition)
**Dependencies:** React Query, job-application.service, sonner (toast)
**Key Details:**
- Three separate hooks for different job matching operations
- Handles mutations with automatic cache invalidation
- Toast notifications for user feedback (Vietnamese)
- Integrates with React Query for state management

**Hook 1: `useJobQualification(jobId, workerId)`**
- Type: Query Hook
- Fetches worker qualification for specific job
- Enabled only when both jobId and workerId provided
- Returns: `QueryResult` with qualification data

**Hook 2: `useApplyToJob()`**
- Type: Mutation Hook
- Parameters: `{ jobId, workerId }`
- On success: Shows toast, invalidates job/application/qualification queries
- On error: Shows error toast with fallback message
- Returns: `UseMutationResult` for mutation state

**Hook 3: `useApproveApplication()`**
- Type: Mutation Hook
- Parameters: `{ applicationId, ownerId }`
- On success: Shows success toast, invalidates job-applications query
- On error: Shows error toast with context-specific message
- Returns: `UseMutationResult` for mutation state

---

## Authentication Patterns

### Session Management Flow
1. User logs in via Supabase phone OTP (from README)
2. `useAuth()` hook retrieves and caches session
3. Session ID used to fetch user profile from `profiles` table
4. Profile includes role (worker/owner) and metadata

### Job Application Flow
1. Worker views job and calls `useJobQualification(jobId, workerId)`
2. System evaluates worker qualification using `evaluateWorkerQualification`
3. If qualifies (all 5 criteria met) → Instant Book (auto-approved)
4. If not qualifies → Request to Book (pending owner approval)
5. Worker can apply via `useApplyToJob()` mutation
6. Owner can approve pending applications via `useApproveApplication()`

---

## Database Integration Points

### Supabase Tables Referenced
- `profiles` - User profiles with reliability_score, account freeze status, verification
- `jobs` - Job postings with language requirements and reliability thresholds
- `job_applications` - Application records with status and QR codes
- `language_skills` - Worker language proficiencies with verification status

### Query Patterns
- Single record retrieval with `.single()`
- Nested selection of related data (language_skills)
- Conditional updates based on job capacity
- Timestamp fields for tracking (applied_at, approved_at, contract_signed_at, etc.)

---

## Reusable Modules Summary

| Module | Purpose | Import Path | Key Export(s) |
|--------|---------|-------------|---|
| Supabase Client | DB/API access | `@/lib/supabase/client` | `createClient()` |
| Job Matching | Qualification logic | `@/lib/job-matching` | `evaluateWorkerQualification()`, `getQualificationFeedback()` |
| Job Application Service | App workflow | `@/lib/services/job-application.service` | `applyToJob()`, `getWorkerQualificationForJob()`, `approveApplication()` |
| Tailwind Utilities | CSS merging | `@/lib/utils` | `cn()` |
| Auth Hook | Session management | `@/hooks/use-auth` | `useAuth()` |
| Job Matching Hooks | App mutations & queries | `@/hooks/use-job-matching` | `useJobQualification()`, `useApplyToJob()`, `useApproveApplication()` |

---

## Key Integration Patterns

### 1. **Layered Architecture**
- **Layer 1 (Database):** Supabase client
- **Layer 2 (Business Logic):** Services (job-application.service)
- **Layer 3 (Algorithms):** Pure functions (job-matching)
- **Layer 4 (State Management):** React hooks
- **Layer 5 (UI):** Components consuming hooks

### 2. **State Management**
- React Query for server state (session, profiles, qualifications)
- Zustand mentioned in README (not yet implemented in these files)
- Cache invalidation on mutations
- Toast notifications for user feedback

### 3. **Error Handling**
- Try-catch blocks in service functions
- Graceful error responses with messages
- Error logging to console
- User-friendly Vietnamese error messages

### 4. **Type Safety**
- TypeScript throughout
- Database types imported from `/types/database.types`
- Interfaces for request/response contracts
- Typed query hooks

---

## Shared Business Logic

### Reliability Score System
- Initial score: 100 (from README)
- Penalties: -2 (late check-in), -20 (no-show, triggers freeze)
- Rewards: +1 (completion)
- Minimum scores configurable per job
- Account freeze until specified date

### Language Verification
- Three language systems supported (Japanese JLPT, Korean TOPIK, English CEFR)
- Levels must be verified before use
- Equal comparison across language systems via weighting
- Level requirements configurable per job

### Qualification Requirements
All 5 must be met for Instant Book:
1. Language skill exists and is verified
2. Language level meets job requirement
3. Reliability score meets job minimum
4. Account not currently frozen
5. User identity verified (intro video)

---

## Production Readiness Checklist

- [x] Database client initialization
- [x] Type-safe queries and mutations
- [x] Error handling in services
- [x] Cache invalidation strategy
- [x] User feedback (toast notifications)
- [ ] QR code generation (marked as mock, needs real implementation)
- [ ] Rate limiting (not visible in these files)
- [ ] Audit logging (not visible in these files)
- [ ] Input validation (handled at API level, not visible here)

---

## Unresolved Questions

1. **QR Code Generation:** Where will actual QR code library (qrcode, qr-code-styling, etc.) be imported?
2. **Geolocation Verification:** Check-in QR validation logic (100m radius) not yet visible in these files
3. **Wallet Integration:** Payment/wallet logic referenced in README not found in lib/hooks
4. **Zustand Store:** State management mentioned in README but not implemented in these files
5. **Rate Limiting:** Any request throttling/rate limiting for job applications?
6. **Audit Trail:** How are rejections and approvals logged for compliance?
7. **Notification System:** Where are push notifications or email alerts sent?

---

**End of Report**
