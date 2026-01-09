# Lib & Hooks Files Index
**Quick Reference for Developers**

## Complete File Listing

### Library Files (4 files)

**1. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/supabase/client.ts` (7 lines)**
- **Purpose:** Supabase client factory
- **Exports:** `createClient()`
- **Key Import:** `createClientComponentClient`, Database types

**2. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/job-matching.ts` (176 lines)**
- **Purpose:** Job qualification evaluation algorithm
- **Exports:** `evaluateWorkerQualification()`, `getQualificationFeedback()`
- **Key Logic:** Language level comparison, account freeze validation, 5-criteria qualification check

**3. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/services/job-application.service.ts` (310 lines)**
- **Purpose:** Job application workflow service
- **Exports:** `applyToJob()`, `getWorkerQualificationForJob()`, `approveApplication()`, `generateCheckInQRCode()`
- **Key Logic:** Application creation with instant book, QR generation, owner approval

**4. `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/utils.ts` (8 lines)**
- **Purpose:** CSS utility helpers
- **Exports:** `cn()`
- **Key Dependencies:** clsx, tailwind-merge

### Hook Files (2 files)

**1. `/Users/tommac/Desktop/Solo Builder/Tapi-app/hooks/use-auth.ts` (39 lines)**
- **Purpose:** Auth session and profile management
- **Exports:** `useAuth()`
- **Returns:** `{ session, user, isLoading }`
- **Key Dependencies:** React Query, Supabase

**2. `/Users/tommac/Desktop/Solo Builder/Tapi-app/hooks/use-job-matching.ts` (65 lines)**
- **Purpose:** Job qualification and application mutations
- **Exports:** `useJobQualification()`, `useApplyToJob()`, `useApproveApplication()`
- **Key Dependencies:** React Query, job-application.service, sonner

---

## Import Patterns

```typescript
// Supabase
import { createClient } from '@/lib/supabase/client';

// Job Matching
import { evaluateWorkerQualification, getQualificationFeedback } from '@/lib/job-matching';

// Job Application Service
import { applyToJob, getWorkerQualificationForJob, approveApplication } from '@/lib/services/job-application.service';

// Utilities
import { cn } from '@/lib/utils';

// Hooks
import { useAuth } from '@/hooks/use-auth';
import { useJobQualification, useApplyToJob, useApproveApplication } from '@/hooks/use-job-matching';
```

---

## Total Code Metrics

| Category | Count | Lines |
|----------|-------|-------|
| Library Files | 4 | ~501 |
| Hook Files | 2 | ~104 |
| **TOTAL** | **6** | **~605** |

---

## Key Functional Areas

- **Database:** Supabase client setup & typed queries
- **Business Logic:** Job matching algorithm & application workflow
- **State Management:** React Query with hooks
- **UI Helpers:** Tailwind CSS utilities
- **Authentication:** Session & profile management

