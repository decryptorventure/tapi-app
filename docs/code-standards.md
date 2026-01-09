# Tapy Code Standards & Architecture Guide

**Version:** 1.0
**Last Updated:** 2026-01-07
**Applies To:** All TypeScript/React code

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Code Organization Principles](#code-organization-principles)
3. [TypeScript Standards](#typescript-standards)
4. [React Component Standards](#react-component-standards)
5. [Naming Conventions](#naming-conventions)
6. [File Structure](#file-structure)
7. [Error Handling](#error-handling)
8. [Type Definitions](#type-definitions)
9. [Testing Guidelines](#testing-guidelines)
10. [Performance Patterns](#performance-patterns)

---

## Project Structure

### Directory Organization

```
/Users/tommac/Desktop/Solo Builder/Tapi-app/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Homepage / job feed
│   └── globals.css              # Global styles & design tokens
├── components/                   # React components
│   ├── ui/                      # Shadcn/UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── job-card.tsx             # Feature components
│   └── providers.tsx            # React context/providers
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts              # Authentication hook
│   └── use-job-matching.ts      # Job matching mutations/queries
├── lib/                         # Business logic & utilities
│   ├── supabase/
│   │   └── client.ts            # Supabase client
│   ├── services/
│   │   └── job-application.service.ts  # Job application logic
│   ├── job-matching.ts          # Core matching algorithm
│   └── utils.ts                 # Helper utilities
├── types/                       # TypeScript definitions
│   └── database.types.ts        # Supabase auto-generated types
├── supabase/                    # Database & migrations
│   └── schema.sql               # PostgreSQL schema
├── public/                      # Static assets
│   └── manifest.json            # PWA manifest
├── docs/                        # Documentation
├── plans/                       # Planning & reports
├── .env.local                   # Environment variables (local)
├── tsconfig.json                # TypeScript config
├── next.config.js               # Next.js config with PWA
├── tailwind.config.ts           # Tailwind CSS config
├── package.json                 # Dependencies
└── README.md                    # Project overview
```

---

## Code Organization Principles

### 1. Layered Architecture
```
Presentation Layer (Components)
  ↓ (uses hooks)
Application Layer (Hooks)
  ↓ (uses services)
Domain Layer (Services & Algorithms)
  ↓ (uses client)
Data Layer (Supabase Client)
  ↓
Database (PostgreSQL)
```

### 2. Separation of Concerns
- **Components:** Presentation & layout only
- **Hooks:** State management & side effects
- **Services:** Business logic & data orchestration
- **Utilities:** Pure functions & helpers
- **Client:** Database communication only

### 3. Dependency Flow
- Components import from hooks
- Hooks import from services & lib
- Services import from database client
- Circular dependencies are forbidden

### 4. Single Responsibility Principle
- Each file has ONE primary purpose
- Functions do ONE thing well
- Avoid mixing concerns

---

## TypeScript Standards

### Type Definitions

#### 1. Database Types
```typescript
// Use auto-generated types from Supabase
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];
type JobApplication = Database['public']['Tables']['job_applications']['Row'];
```

#### 2. Custom Types
```typescript
// Define in separate type files, NOT in components
// Format: SCREAMING_SNAKE_CASE for constants, PascalCase for types

interface WorkerQualification {
  hasLanguageSkill: boolean;
  hasLanguageLevelVerified: boolean;
  reliabilityScoreOk: boolean;
  accountNotFrozen: boolean;
  isVerified: boolean;
  canInstantBook: boolean;
}

interface ApplyToJobResult {
  success: boolean;
  application?: JobApplication;
  message: string;
  feedbackMessage?: string;
}
```

#### 3. Enums
```typescript
enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

enum LanguageCode {
  JAPANESE = 'ja',
  KOREAN = 'ko',
  ENGLISH = 'en',
}
```

### 4. Strict Type Checking
- Enable `strict: true` in tsconfig.json ✅
- Never use `any` type
- Use `unknown` if type is truly unknown
- Export types from modules explicitly

```typescript
// ❌ WRONG
const data: any = response.data;

// ✅ CORRECT
const data: WorkerProfile = response.data as WorkerProfile;
```

### 5. Function Signatures
```typescript
// Always specify return types
function evaluateWorkerQualification(
  worker: Profile,
  jobRequirements: Job['required_language_level']
): WorkerQualification {
  // ...
}

// Use type-safe callbacks
const handleApply = async (jobId: string): Promise<void> => {
  // ...
};
```

---

## React Component Standards

### 1. Component Structure

```typescript
'use client';

import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useJobQualification } from '@/hooks/use-job-matching';
import type { Job } from '@/types/database.types';

interface JobCardProps {
  job: Job;
  workerId: string;
}

export const JobCard: FC<JobCardProps> = ({ job, workerId }) => {
  const [isApplying, setIsApplying] = useState(false);
  const { data: qualification } = useJobQualification(job.id, workerId);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      // Apply logic
    } catch (error) {
      // Error handling
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div>
      {/* Render JSX */}
    </div>
  );
};
```

### 2. Component Rules

#### ✅ DO
- Use functional components (not classes)
- Use hooks for state & side effects
- Create reusable, composable components
- Pass data via props
- Use TypeScript interfaces for props
- Memoize expensive computations
- Handle loading & error states

#### ❌ DON'T
- Use `useState` when React Query is appropriate
- Create overly complex components (>200 LOC)
- Pass unnecessary props down tree
- Use inline styles (use className + Tailwind)
- Mutate props directly
- Forget error boundaries

### 3. Prop Validation

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

// All props explicitly typed
export const MyButton: FC<ButtonProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
}) => {
  return <button disabled={disabled}>{label}</button>;
};
```

### 4. Server vs Client Components

```typescript
// ✅ Server Component (default in App Router)
// Used for database queries, API calls
export default async function Page() {
  const jobs = await fetchJobs();
  return <JobList jobs={jobs} />;
}

// ✅ Client Component
'use client';
// Used for interactivity, hooks
export function JobCard({ job }: { job: Job }) {
  const [liked, setLiked] = useState(false);
  return <div onClick={() => setLiked(!liked)}>{job.title}</div>;
}
```

---

## Naming Conventions

### TypeScript Files
- **Components:** `PascalCase` + `.tsx` → `JobCard.tsx`
- **Hooks:** `camelCase` + `use` prefix → `use-job-matching.ts`
- **Services:** `camelCase` + `.service.ts` → `job-application.service.ts`
- **Utils:** `camelCase` + `.ts` → `date-utils.ts`
- **Types:** `PascalCase` in uppercase for enums → `ApplicationStatus.ts`

### Variables & Functions
- **Constants:** `SCREAMING_SNAKE_CASE` → `MAX_RELIABILITY_SCORE = 100`
- **Functions:** `camelCase` → `evaluateWorkerQualification()`
- **Variables:** `camelCase` → `workerProfile`, `isLoading`
- **Booleans:** prefix with `is`, `has`, `can` → `isLoading`, `hasLanguageSkill`, `canInstantBook`

### React Hooks
```typescript
// ✅ Correct naming
const useJobQualification = () => { /* ... */ };
const useApplyToJob = () => { /* ... */ };
const useAuth = () => { /* ... */ };

// ❌ Wrong naming
const getJobQualification = () => { /* ... */ };  // Missing "use"
const useAppliedJobs = () => { /* ... */ };       // Ambiguous
```

### Database Columns
```sql
-- snake_case for database columns
- user_id
- created_at
- is_verified
- reliability_score
- job_id
- application_status
```

---

## File Structure

### Component File Template

```typescript
// components/job-card.tsx

'use client';

import { FC } from 'react';
import type { Job } from '@/types/database.types';
import { Card } from '@/components/ui/card';

/**
 * JobCard displays a single job listing with qualification status
 * and application button.
 */
interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
}

export const JobCard: FC<JobCardProps> = ({ job, onApply }) => {
  return (
    <Card>
      <h3>{job.title}</h3>
      {/* Component JSX */}
    </Card>
  );
};
```

### Service File Template

```typescript
// lib/services/job-application.service.ts

import { createClient } from '@/lib/supabase/client';
import { evaluateWorkerQualification } from '@/lib/job-matching';
import type { Database } from '@/types/database.types';

/**
 * Service for managing job applications with Instant Book logic
 */

export async function applyToJob(
  jobId: string,
  workerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient();
    // Implementation
    return { success: true, message: 'Applied successfully' };
  } catch (error) {
    console.error('Error applying to job:', error);
    throw error;
  }
}
```

### Hook File Template

```typescript
// hooks/use-job-matching.ts

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { applyToJob } from '@/lib/services/job-application.service';
import { toast } from 'sonner';

/**
 * Hook for job application mutations and queries
 */

export function useApplyToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, workerId }: { jobId: string; workerId: string }) => {
      return applyToJob(jobId, workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Applied successfully');
    },
    onError: (error) => {
      toast.error('Failed to apply');
      console.error(error);
    },
  });
}
```

---

## Error Handling

### 1. Try-Catch Pattern

```typescript
// ✅ Correct error handling
async function applyToJob(jobId: string, workerId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('job_applications').insert([
      { job_id: jobId, worker_id: workerId }
    ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error applying to job:', error);
    throw new Error('Failed to apply to job. Please try again.');
  }
}
```

### 2. Supabase Error Handling

```typescript
// Handle Supabase-specific errors
try {
  const { data, error } = await supabase.from('jobs').select('*');

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found error
      return [];
    }
    if (error.code === '42P01') {
      // Table not found
      console.error('Database schema error:', error);
    }
    throw error;
  }

  return data;
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### 3. User-Facing Error Messages

```typescript
// Vietnamese error messages for users
const ERROR_MESSAGES: Record<string, string> = {
  QUALIFICATION_FAILED: 'Bạn không đủ điều kiện cho công việc này',
  DUPLICATE_APPLICATION: 'Bạn đã ứng tuyển cho công việc này',
  ACCOUNT_FROZEN: 'Tài khoản của bạn đang bị khóa',
  JOB_CLOSED: 'Công việc này không còn mở',
};
```

---

## Type Definitions

### Database Types Integration

```typescript
// ✅ Always use database types
import type {
  Database,
  Json,
} from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];
type JobApplication = Database['public']['Tables']['job_applications']['Row'];

// Use in functions
function processWorker(profile: Profile): void {
  const score: number = profile.reliability_score;
}
```

### Type Assertions

```typescript
// ✅ Use 'as' only when certain
const job = data as Job;

// ✅ Better: validate first
if (isJobData(data)) {
  const job: Job = data;
}

// Type guard example
function isJobData(data: unknown): data is Job {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data
  );
}
```

---

## Testing Guidelines

### 1. Unit Tests

```typescript
// tests/lib/job-matching.test.ts
import { evaluateWorkerQualification } from '@/lib/job-matching';

describe('evaluateWorkerQualification', () => {
  it('should return instant_book if all criteria met', () => {
    const worker = { /* ... */ };
    const jobReq = { /* ... */ };

    const result = evaluateWorkerQualification(worker, jobReq);

    expect(result.canInstantBook).toBe(true);
  });
});
```

### 2. Test Naming

- Test file: `{module}.test.ts` or `{module}.spec.ts`
- Test names: Describe behavior, not implementation
- Use `describe()` for organization

```typescript
// ✅ Good test names
it('should freeze account after no-show', () => {});
it('should increase score by 1 on job completion', () => {});
it('should return REQUEST_TO_BOOK if reliability score too low', () => {});

// ❌ Bad test names
it('freezes', () => {});
it('test scoring', () => {});
it('returns value', () => {});
```

### 3. Test Coverage
- Aim for 80%+ coverage on critical paths
- 100% coverage for business logic (job-matching.ts)
- 60%+ for UI components
- Focus on behavior, not implementation details

---

## Performance Patterns

### 1. React Query Optimization

```typescript
// ✅ Proper React Query usage
function JobList() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error />;

  return jobs.map(job => <JobCard key={job.id} job={job} />);
}
```

### 2. Memoization

```typescript
// Memoize expensive calculations
import { useMemo, useCallback } from 'react';

export function JobFilter({ jobs }: { jobs: Job[] }) {
  // Memoize filtered list
  const filteredJobs = useMemo(
    () => jobs.filter(job => job.status === 'open'),
    [jobs]
  );

  // Memoize callback
  const handleApply = useCallback(
    (jobId: string) => {
      applyToJob(jobId);
    },
    []
  );

  return <div>{/* ... */}</div>;
}
```

### 3. Database Query Optimization

```typescript
// ✅ Indexed queries
const { data: jobs } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', 'open')      // Uses index
  .order('created_at', { ascending: false });

// ❌ Avoid N+1 queries
// Instead of looping and querying, use batch operations
const applications = await supabase
  .from('job_applications')
  .select('*, profiles(*)')  // Use join
  .in('job_id', jobIds);
```

### 4. Image & Asset Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/job-bg.jpg"
  alt="Job background"
  width={400}
  height={300}
  quality={80}
/>
```

---

## Code Review Checklist

- [ ] TypeScript strict mode: No `any` types
- [ ] Components under 200 LOC
- [ ] All props typed with interfaces
- [ ] Error handling implemented
- [ ] No console.logs in production code
- [ ] Database queries indexed
- [ ] No circular dependencies
- [ ] Tests written for critical logic
- [ ] Accessibility considered (a11y)
- [ ] Performance implications reviewed
- [ ] Vietnamese error messages used
- [ ] Documentation/JSDoc comments added

---

## Design System

### Color Palette
- **Primary:** Deep Blue (#1e3a8a)
- **Secondary:** Orange (#ea580c)
- **Destructive:** Red (#dc2626)
- **Success:** Green (#16a34a)
- **Warning:** Amber (#ca8a04)

### Typography
- **Heading:** font-bold, text-2xl
- **Subheading:** font-semibold, text-lg
- **Body:** font-normal, text-base
- **Caption:** font-normal, text-sm, text-gray-500

### Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

