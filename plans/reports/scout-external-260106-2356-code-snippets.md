# Key Code Snippets - Lib & Hooks
**Reference implementations for understanding core patterns**

---

## 1. Supabase Client Setup
**File:** `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/supabase/client.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

export const createClient = () => {
  return createClientComponentClient<Database>();
};
```

**Usage Pattern:**
```typescript
const supabase = createClient();
const { data, error } = await supabase.from('profiles').select('*');
```

---

## 2. Job Matching Algorithm - Qualification Evaluation
**File:** `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/job-matching.ts`

```typescript
export function evaluateWorkerQualification(
  worker: WorkerProfile,
  jobRequirements: JobRequirements
): WorkerQualification {
  // 1. Check if worker has the required language skill
  const requiredLanguageSkill = worker.language_skills.find(
    (skill) => skill.language === jobRequirements.required_language
  );
  
  const hasRequiredLanguage = !!requiredLanguageSkill;
  
  // 2. Check if language level meets requirement
  const meetsLanguageLevel = requiredLanguageSkill
    ? requiredLanguageSkill.verification_status === 'verified' &&
      compareLanguageLevels(
        requiredLanguageSkill.level,
        jobRequirements.required_language_level,
        jobRequirements.required_language
      )
    : false;
  
  // 3. Check reliability score
  const meetsReliabilityScore = worker.reliability_score >= jobRequirements.min_reliability_score;
  
  // 4. Check account status
  const isAccountActive = isAccountActive(worker);
  
  // 5. Check if verified (has intro video)
  const isVerified = worker.is_verified;
  
  // 6. Determine if qualifies for Instant Book - ALL criteria must be met
  const qualifiesForInstantBook =
    hasRequiredLanguage &&
    meetsLanguageLevel &&
    meetsReliabilityScore &&
    isAccountActive &&
    isVerified;
  
  return {
    hasRequiredLanguage,
    meetsLanguageLevel,
    meetsReliabilityScore,
    isAccountActive,
    isVerified,
    qualifiesForInstantBook,
  };
}
```

**Key Insight:** All 5 criteria must pass for Instant Book approval (AND logic).

---

## 3. Language Level Comparison
**File:** `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/job-matching.ts`

```typescript
const LANGUAGE_LEVEL_WEIGHT: Record<LanguageLevel, number> = {
  beginner: 0,
  // Japanese (JLPT)
  n5: 1, n4: 2, n3: 3, n2: 4, n1: 5,
  // Korean (TOPIK)
  topik_1: 1, topik_2: 2, topik_3: 3, topik_4: 4, topik_5: 5, topik_6: 6,
  // English (CEFR)
  a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6,
};

function compareLanguageLevels(
  workerLevel: LanguageLevel,
  requiredLevel: LanguageLevel,
  language: LanguageType
): boolean {
  const workerWeight = LANGUAGE_LEVEL_WEIGHT[workerLevel] || 0;
  const requiredWeight = LANGUAGE_LEVEL_WEIGHT[requiredLevel] || 0;
  
  return workerWeight >= requiredWeight;
}
```

**Key Insight:** Universal weighting system allows fair comparison across different language certification systems.

---

## 4. Job Application with Instant Book Logic
**File:** `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/services/job-application.service.ts`

```typescript
export async function applyToJob(
  jobId: string,
  workerId: string
): Promise<ApplyToJobResult> {
  const supabase = createClient();
  
  try {
    // 1. Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    // ... validation checks ...
    
    // 4. Fetch worker profile with language skills
    const { data: workerProfile } = await supabase
      .from('profiles')
      .select(`
        *,
        language_skills (
          language,
          level,
          verification_status
        )
      `)
      .eq('id', workerId)
      .single();
    
    // 5. Evaluate qualification
    const qualification = evaluateWorkerQualification(
      workerProfileTyped,
      {
        required_language: job.required_language,
        required_language_level: job.required_language_level,
        min_reliability_score: job.min_reliability_score,
      }
    );
    
    const isInstantBook = qualification.qualifiesForInstantBook;
    
    // 6. Create application (auto-approved if instant book)
    const applicationData: Partial<JobApplication> = {
      job_id: jobId,
      worker_id: workerId,
      status: isInstantBook ? 'approved' : 'pending',
      is_instant_book: isInstantBook,
      applied_at: new Date().toISOString(),
      ...(isInstantBook && {
        approved_at: new Date().toISOString(),
        contract_signed_at: new Date().toISOString(),
      }),
    };
    
    const { data: application } = await supabase
      .from('job_applications')
      .insert(applicationData)
      .select()
      .single();
    
    // 7. If instant book, update job and generate QR code
    if (isInstantBook) {
      await supabase
        .from('jobs')
        .update({
          current_workers: job.current_workers + 1,
          ...(job.current_workers + 1 >= job.max_workers && { status: 'filled' }),
        })
        .eq('id', jobId);
      
      const qrCode = await generateCheckInQRCode(application.id);
      await supabase
        .from('job_applications')
        .update({
          checkin_qr_code: qrCode,
          checkin_qr_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', application.id);
    }
    
    return {
      success: true,
      application,
      isInstantBook,
      message: isInstantBook
        ? 'Bạn đã đặt chỗ thành công!'
        : 'Đơn ứng tuyển đã được gửi. Chủ nhà hàng sẽ xem xét.',
    };
    
  } catch (error) {
    return {
      success: false,
      isInstantBook: false,
      message: 'Có lỗi xảy ra',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Key Insight:** Application result differs based on qualification - auto-approved or pending.

---

## 5. React Query Authentication Hook
**File:** `/Users/tommac/Desktop/Solo Builder/Tapi-app/hooks/use-auth.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';

export function useAuth() {
  const supabase = createClient();

  // First query: Get session
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Second query: Get user profile (only if session exists)
  const { data: user } = useQuery({
    queryKey: ['user-profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      return data as Profile | null;
    },
    enabled: !!session?.user?.id, // Only fetch if session exists
  });

  return {
    session,
    user,
    isLoading: !session,
  };
}
```

**Key Insight:** Dependent queries - profile only fetches after session exists.

---

## 6. Job Application Mutation Hooks
**File:** `/Users/tommac/Desktop/Solo Builder/Tapi-app/hooks/use-job-matching.ts`

```typescript
export function useApplyToJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, workerId }: { jobId: string; workerId: string }) =>
      applyToJob(jobId, workerId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        // Invalidate related queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['job-applications'] });
        queryClient.invalidateQueries({ queryKey: ['job-qualification'] });
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error('Có lỗi xảy ra khi ứng tuyển');
      console.error(error);
    },
  });
}
```

**Key Insight:** Mutation with automatic cache invalidation and user notifications.

---

## 7. CSS Utility Helper
**File:** `/Users/tommac/Desktop/Solo Builder/Tapi-app/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage Pattern:**
```typescript
// Merges classes and resolves Tailwind conflicts
<button className={cn("px-4 py-2", "px-6", isActive && "bg-blue-500")}>
  Click me
</button>
// Output: "px-6 py-2 bg-blue-500" (px-6 overrides px-4)
```

---

## Integration Example: Using All Components Together

```typescript
// Component using auth hook
function JobListComponent() {
  const { user, isLoading } = useAuth();
  const { data: qualification } = useJobQualification(jobId, user?.id ?? null);
  const applyMutation = useApplyToJob();

  const handleApply = () => {
    applyMutation.mutate({
      jobId,
      workerId: user?.id ?? '',
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {qualification?.qualifiesForInstantBook ? (
        <button onClick={handleApply} disabled={applyMutation.isPending}>
          Instant Book
        </button>
      ) : (
        <button onClick={handleApply} disabled={applyMutation.isPending}>
          Request to Book
        </button>
      )}
      <p>{qualification?.feedback}</p>
    </div>
  );
}
```

---

**End of Code Snippets**
