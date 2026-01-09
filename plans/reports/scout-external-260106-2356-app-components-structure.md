# Tapy App: App & Components Directory Structure Scout Report

**Generated:** 2026-01-06 23:56  
**Project:** Tapy - Just-in-Time Recruitment Platform  
**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, React Query, Zustand

---

## Executive Summary

Tapy is a recruitment platform connecting Japanese/Korean restaurants in Vietnam with verified part-time workers. The application uses Next.js 14 with a client-heavy architecture leveraging React Query for state management and Supabase for backend services. The codebase is minimal but well-structured, focusing on core job matching and application functionality.

**Key Architectural Patterns:**
- Client-side heavy (marked with 'use client')
- React Query for data fetching and caching
- Shadcn/UI component library
- Type-safe Supabase integration
- Instant Book vs Request to Book matching logic

---

## File Organization & Purpose

### Root Application Files

#### `/app/layout.tsx`
**Type:** Root Layout Component  
**Purpose:** Global layout wrapper for entire application  
**Key Features:**
- Metadata configuration (PWA, theme color, manifest)
- Vietnamese language support (vi)
- Providers wrapper (React Query, Toaster)
- Supabase auth-helpers integration
- Sonner toast notifications setup

```typescript
// Includes:
- Metadata: title, description, manifest, themeColor, appleWebApp config
- Root HTML structure with Vietnamese locale
- Providers component for client-side state
- Toaster for notifications (top-center position)
```

#### `/app/page.tsx`
**Type:** Homepage / Main Feed  
**Purpose:** Worker job listing & discovery page  
**Key Features:**
- Fetches open jobs from Supabase
- Displays jobs in card format
- Real-time job list with React Query
- Empty state handling

```typescript
// Features:
- 'use client' directive (client component)
- useQuery hook for fetching jobs
- Filters jobs by status: 'open'
- Sorts by created_at descending
- Maps jobs to JobCard components
- Shows empty state message
```

#### `/app/globals.css`
**Type:** Global Stylesheet  
**Purpose:** Tailwind CSS setup with design system tokens  
**Key Features:**
- Tailwind directive imports (@tailwind)
- CSS custom properties for theming
- Light and dark mode support
- Color variables (primary: blue #1e3a8a, secondary: orange #ea580c)
- Responsive spacing and typography

```css
// Tokens:
- Primary: Deep blue (221.2 83.2% 53.3%)
- Secondary: Orange (24.6 95% 53.1%)
- Destructive: Red (0 84.2% 60.2%)
- Border radius: 0.5rem default
- Dark mode CSS variables included
```

---

## Components Directory Structure

### `/components/providers.tsx`
**Type:** Context Provider Wrapper  
**Purpose:** Initialize React Query client and provide to app  
**Key Features:**
- Wraps entire app with QueryClientProvider
- Default query configuration (1-minute staleTime)
- Disables refetchOnWindowFocus
- Client component initialization

```typescript
// Configuration:
- queryClient.defaultOptions.queries.staleTime: 60 * 1000 (1 min)
- refetchOnWindowFocus: false
- Children wrapped with QueryClientProvider
```

### `/components/job-card.tsx`
**Type:** Reusable Job Card Component  
**Purpose:** Display individual job listing with qualification status  
**Key Features:**
- Shows job details (title, description, language, time, rate)
- Displays worker qualification status
- Two-state button: "Instant Book" or "Request to Book"
- Uses custom hooks for qualification checking
- Color-coded badges for languages and levels
- Visual feedback with icons (Clock, MapPin, DollarSign, Users)

```typescript
// Display Elements:
- Job title & description
- Language badges (blue) with level badges (orange)
- Shift date/time formatted in Vietnamese
- Hourly rate in VND
- Dress code info
- Qualification feedback message
- Apply button with loading state

// Button States:
- Instant Book: Green (#06b6d4), disabled if not qualified
- Request: Blue (primary), disabled if already applied
- Loading: Shows "Đang xử lý..."
```

### `/components/ui/button.tsx`
**Type:** Shadcn/UI Button Component  
**Purpose:** Reusable button primitive with variants  
**Key Features:**
- Multiple variants: default, destructive, outline, secondary, ghost, link
- Multiple sizes: default, sm, lg, icon
- Forward ref for accessibility
- Class variance authority (CVA) for styling
- Tailwind CSS utilities

```typescript
// Variants:
- default: Primary blue with hover
- destructive: Red background
- outline: Border style
- secondary: Orange style
- ghost: Transparent with hover
- link: Text link style

// Sizes:
- default: h-10 px-4 py-2
- sm: h-9 px-3
- lg: h-11 px-8
- icon: h-10 w-10 (square)
```

### `/components/ui/card.tsx`
**Type:** Shadcn/UI Card Component  
**Purpose:** Container component with multiple sub-components  
**Key Features:**
- Main Card wrapper with rounded borders and shadow
- CardHeader, CardTitle, CardDescription
- CardContent, CardFooter sub-components
- Forward ref implementation
- Customizable with className prop

```typescript
// Components:
- Card: Main wrapper (rounded-lg, border, shadow-sm)
- CardHeader: Flex column with 1.5 spacing
- CardTitle: h3 heading (2xl, semibold)
- CardDescription: Muted text paragraph
- CardContent: p-6 pt-0 padding
- CardFooter: Flex row p-6 pt-0
```

---

## Hooks Directory Structure

### `/hooks/use-auth.ts`
**Type:** Custom React Hook  
**Purpose:** Handle authentication state & user profile loading  
**Key Features:**
- Fetches current session from Supabase Auth
- Loads user profile from profiles table
- Dependent queries (only fetches profile if session exists)
- Loading state management
- Type-safe with database types

```typescript
// Returns:
- session: Current Supabase session
- user: User profile (from profiles table)
- isLoading: Boolean indicating session load state

// Logic:
- useQuery for session (always enabled)
- useQuery for user profile (enabled only with valid session ID)
- Profile query depends on session.user.id
```

### `/hooks/use-job-matching.ts`
**Type:** Custom React Hooks (3 hooks)  
**Purpose:** Manage job qualification checking and application submission  
**Key Features:**

**1. useJobQualification(jobId, workerId)**
- Fetches worker's qualification for specific job
- Checks if worker qualifies for Instant Book
- Returns qualification details and feedback message
- Enabled only when both jobId and workerId exist

**2. useApplyToJob()**
- Mutation hook for submitting job application
- Shows success/error toast notifications
- Invalidates relevant React Query caches
- Handles loading/pending states

**3. useApproveApplication()**
- Mutation hook for owners to approve pending applications
- Used in owner dashboard (not visible in current code)
- Toast notifications for success/error
- Cache invalidation for updated applications

```typescript
// Returns:
- useJobQualification: Query result with qualification & feedback
- useApplyToJob: Mutation with onSuccess/onError handlers
- useApproveApplication: Mutation with authorization check
```

---

## Library & Utilities

### `/lib/utils.ts`
**Type:** Utility Function  
**Purpose:** Merge Tailwind classes with priority  
**Key Features:**
- Uses clsx for conditional classes
- Uses tailwind-merge for conflict resolution
- Prevents Tailwind class conflicts

```typescript
// Function: cn()
// Purpose: Safely merge Tailwind CSS classes
// Example: cn("px-4", "px-2") → "px-2" (correct precedence)
```

### `/lib/supabase/client.ts`
**Type:** Supabase Client Factory  
**Purpose:** Create typed Supabase client for use in client components  
**Key Features:**
- Uses Supabase auth-helpers for Next.js
- Type-safe with Database interface
- Client-side only initialization
- Used throughout app for data queries

```typescript
// Exports: createClient()
// Returns: Typed Supabase client with Database types
// Used in: page.tsx, job-application.service.ts, hooks
```

### `/lib/job-matching.ts`
**Type:** Core Business Logic  
**Purpose:** Job matching algorithm determining Instant Book eligibility  
**Key Features:**

**Language Level Hierarchy (LANGUAGE_LEVEL_WEIGHT):**
- Japanese JLPT: N5(1) → N1(5)
- Korean TOPIK: 1(1) → 6(6)
- English CEFR: A1(1) → C2(6)

**Qualification Criteria (all must be true for Instant Book):**
1. Has required language skill
2. Language level meets requirement (verified)
3. Reliability score >= min required (default: 50)
4. Account not frozen
5. Verified (has intro video)

**Main Functions:**
- `compareLanguageLevels()`: Checks if worker level >= required level
- `isAccountActive()`: Checks if frozen period expired
- `evaluateWorkerQualification()`: Main qualification evaluator
- `getQualificationFeedback()`: User-friendly feedback message

```typescript
// Returns: WorkerQualification interface with:
{
  hasRequiredLanguage: boolean
  meetsLanguageLevel: boolean
  meetsReliabilityScore: boolean
  isAccountActive: boolean
  isVerified: boolean
  qualifiesForInstantBook: boolean
}
```

### `/lib/services/job-application.service.ts`
**Type:** Service Layer  
**Purpose:** Handle job application logic with Instant Book decision  
**Key Features:**

**Main Functions:**

1. **applyToJob(jobId, workerId)**
   - Fetches job and worker profile
   - Evaluates worker qualification
   - Creates application (approved or pending status)
   - Generates QR code for Instant Book applications
   - Updates job worker count
   - Returns ApplyToJobResult with success/message

2. **getWorkerQualificationForJob(jobId, workerId)**
   - Returns detailed qualification object
   - Includes feedback message
   - Checks if job is still open
   - Type-safe with database types

3. **approveApplication(applicationId, ownerId)**
   - Owner approves pending application
   - Verifies ownership (authorization)
   - Generates QR code
   - Returns success/error message

**Workflow:**
```
Apply → Check Job Status → Verify No Duplicate → 
Get Worker Profile → Evaluate Qualification → 
Create Application (Approved/Pending) → 
If Instant Book: Generate QR Code → Update Job Count
```

---

## Types Definition

### `/types/database.types.ts`
**Type:** TypeScript Type Definitions  
**Purpose:** Type safety for Supabase entities  
**Key Types:**

**Enums:**
- UserRole: 'worker' | 'owner'
- LanguageType: 'japanese' | 'korean' | 'english'
- LanguageLevel: Hierarchical levels (N5-N1, TOPIK 1-6, A1-C2)
- JobStatus: 'open' | 'filled' | 'completed' | 'cancelled'
- ApplicationStatus: 'pending' | 'approved' | 'rejected' | 'completed' | 'no_show'

**Interfaces:**

**Profile**
- User authentication data (id, phone, email)
- Role-specific fields (worker: university, bio, reliability; owner: restaurant details)
- Verification fields (is_verified, is_account_frozen)
- Timestamps (created_at, updated_at)

**LanguageSkill**
- User language certification
- Verification status with verified_by and verified_at
- Quiz score and certificate URL
- Language type and level

**Job**
- Job listing details (title, date, time, rate)
- Requirements (language type/level, min reliability)
- Worker capacity (max_workers, current_workers)
- Status tracking

**JobApplication**
- Application tracking
- Status and timestamps (applied_at, approved_at, contract_signed_at)
- Instant Book flag
- QR code for check-in (code + expiration)

**Database**
- TypeScript interface for entire database schema
- Table row, insert, and update types
- Used for Supabase type safety

---

## Architectural Patterns & Design Decisions

### State Management
- **React Query:** Server state (jobs, user profile, qualifications)
- **Client-side Only:** No Zustand usage visible in current code
- **Pattern:** Query-first, minimal client state

### Data Flow
```
HomePage → useQuery(jobs) → Supabase
         → maps JobCard components
         
JobCard → useAuth() → Get user ID
        → useJobQualification() → Evaluate match
        → useApplyToJob() → Submit application
        
applyToJob → Supabase → evaluateWorkerQualification() → DB update
```

### Component Patterns
- **'use client' directive:** All interactive components marked
- **Custom Hooks:** Logic abstraction (auth, job matching)
- **Primitive Components:** Shadcn/UI for consistency
- **Composition:** JobCard composes Button, Icons, utilities

### Error Handling
- Try-catch in service functions
- Toast notifications for user feedback
- Query-level error handling with React Query
- Graceful error messages (Vietnamese)

### Performance Optimizations
- React Query caching (1-minute staleTime)
- Disabled refetchOnWindowFocus
- Query key strategies for cache invalidation
- Type-safe queries prevent runtime errors

---

## Key Features Implemented

### 1. Job Discovery Feed
- List open jobs with pagination (implicit)
- Filter/sort by created_at descending
- Real-time updates with React Query

### 2. Worker Qualification Matching
- Instant Book vs Request to Book logic
- Language level verification
- Reliability score checking
- Account freeze status
- Verification requirement (intro video)

### 3. Job Application Flow
- One-click application submission
- Automatic status determination (Instant/Request)
- QR code generation for Instant Book
- Duplicate application prevention
- Toast notifications for feedback

### 4. Authentication
- Phone OTP via Supabase Auth
- Session management
- User profile loading
- Role-based access (not visible in current code)

### 5. UI/UX Elements
- Responsive card layout
- Icon-based information display
- Color-coded status indicators
- Loading states and disabled states
- Multilingual support (Vietnamese, English, Japanese, Korean)

---

## Current Limitations & TODOs

### Missing/Stub Implementations
1. **QR Code Generation:** Currently returns mock token (`QR-${applicationId}-${Date.now()}`)
   - File: `/lib/services/job-application.service.ts` line 185-189
   - **TODO:** Integrate qrcode library for actual QR generation

2. **Search & Filter:** Design spec includes search and filtering
   - Not implemented in current code
   - **TODO:** Add search bar and filter modal component

3. **Pagination:** Job list doesn't show pagination
   - **TODO:** Implement infinite scroll or pagination

4. **Owner Dashboard:** No owner-facing UI implemented
   - **TODO:** Add owner job management, application approval UI

5. **Worker Onboarding:** No onboarding flow visible
   - **TODO:** Create language verification and profile completion flows

6. **Notifications:** Toast visible but notification bell not implemented
   - **TODO:** Add notification system and badge count

7. **Geolocation:** Check-in mentions 100m radius verification
   - **TODO:** Implement geolocation check-in logic

### Known Issues
- Redundant type casting in job-application.service.ts (line 92, 97)
- Feedback message in getQualificationFeedback has logic error (line 162)
- No error boundary components

---

## File Summary Table

| Path | Type | Purpose | Status |
|------|------|---------|--------|
| app/layout.tsx | Layout | Root layout & providers | ✅ Complete |
| app/page.tsx | Page | Job feed homepage | ✅ Complete |
| app/globals.css | Styles | Design tokens & Tailwind | ✅ Complete |
| components/providers.tsx | Provider | React Query setup | ✅ Complete |
| components/job-card.tsx | Component | Job listing card | ✅ Complete |
| components/ui/button.tsx | Primitive | Button component | ✅ Complete |
| components/ui/card.tsx | Primitive | Card container | ✅ Complete |
| hooks/use-auth.ts | Hook | Auth & profile state | ✅ Complete |
| hooks/use-job-matching.ts | Hook | Job matching mutations | ✅ Complete |
| lib/utils.ts | Utility | CSS class merging | ✅ Complete |
| lib/supabase/client.ts | Factory | Supabase client | ✅ Complete |
| lib/job-matching.ts | Logic | Matching algorithm | ✅ Complete |
| lib/services/job-application.service.ts | Service | Application workflow | ⚠️ Needs QR impl |
| types/database.types.ts | Types | TypeScript definitions | ✅ Complete |

---

## Next Steps for Development

### High Priority
1. Implement QR code generation (qrcode library)
2. Add owner dashboard for job posting and application management
3. Implement worker onboarding flow with language verification
4. Add search and filtering on job feed

### Medium Priority
1. Implement geolocation check-in verification
2. Add pagination/infinite scroll to job feed
3. Create notification system
4. Build reliability score history page

### Low Priority
1. Add dark mode toggle
2. Implement wallet/payment integration (currently mock)
3. Add contract signing flow
4. Implement analytics

---

## Unresolved Questions

1. **Multi-language Support:** Design mentions Japanese/Korean/English UI text - where are translation files?
2. **PWA Implementation:** Manifest mentioned but not visible - where is public/manifest.json?
3. **Mobile Responsiveness:** No mobile-specific components visible - how is mobile optimized?
4. **API Routes:** Any API routes or all Supabase direct?
5. **Form Validation:** No form libraries (zod, react-hook-form) visible - how are forms validated?
6. **Authentication Flow:** Where is phone OTP sign-in UI?
7. **Database Migrations:** Where are Supabase migrations/scripts?
8. **Testing:** Any test files (jest, vitest)?
