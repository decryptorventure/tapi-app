# Phase 03: Job Completion Flow

**Effort:** 3h | **Priority:** P1 | **Status:** Pending

## Objective
Enable owners to mark approved applications as "completed" and update worker reliability.

---

## Current State

**Exists:**
- `checkin.service.ts` has `processCheckOut()` that marks application completed + updates score
- Owner applications page shows approved workers with "Instant Book"/"Da duyet" badge
- Database has `status` column supporting 'completed'

**Missing:**
- No "Mark Complete" UI button on owner applications page
- No direct completion method (without QR scan)
- No "No Show" button for missing workers

---

## Task 1: Add "Mark Complete" Button (1.5h)

### Files
- `/app/owner/jobs/[id]/applications/page.tsx`

### Changes

Add handler function after `handleReject`:
```typescript
const handleMarkComplete = async (applicationId: string, workerId: string, jobId: string) => {
  setProcessing(applicationId);
  const supabase = createUntypedClient();

  try {
    // Update application status
    const { error } = await supabase
      .from('job_applications')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;

    // Update worker reliability score (+1 for completion)
    const { data: profile } = await supabase
      .from('profiles')
      .select('reliability_score')
      .eq('id', workerId)
      .single();

    if (profile) {
      const newScore = Math.min(100, profile.reliability_score + 1);
      await supabase
        .from('profiles')
        .update({ reliability_score: newScore })
        .eq('id', workerId);

      // Log to reliability_history
      await supabase
        .from('reliability_history')
        .insert({
          worker_id: workerId,
          score_change: 1,
          reason: 'job_completed',
          new_score: newScore,
        });
    }

    toast.success('Da danh dau hoan thanh!');
    fetchData();
  } catch (error: any) {
    console.error('Complete error:', error);
    toast.error('Loi danh dau hoan thanh');
  } finally {
    setProcessing(null);
  }
};
```

### UI Changes
In the applications list, after approve/reject buttons section (~line 409), add for approved applications:

```tsx
{app.status === 'approved' && (
  <div className="flex gap-2 mt-2">
    <Button
      size="sm"
      variant="default"
      onClick={() => handleMarkComplete(app.id, app.worker_id, jobId)}
      disabled={processing === app.id}
      className="flex-1 bg-primary hover:bg-primary/90"
    >
      {processing === app.id ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Hoan thanh
        </>
      )}
    </Button>
  </div>
)}
```

### Imports to Add
```tsx
import { CheckCircle2 } from 'lucide-react';
```

### Validation
- [ ] "Hoan thanh" button appears for approved applications
- [ ] Clicking updates status to 'completed'
- [ ] Worker reliability score increases by 1
- [ ] reliability_history row created
- [ ] Badge changes to "Hoan thanh" (green)

---

## Task 2: Add "No Show" Button (1h)

### Files
- `/app/owner/jobs/[id]/applications/page.tsx`

### Changes

Add handler:
```typescript
const handleNoShow = async (applicationId: string) => {
  setProcessing(applicationId);

  try {
    const result = await CheckinService.processNoShow(applicationId);

    if (!result.success) {
      throw new Error(result.message);
    }

    toast.success('Da ghi nhan vang mat');
    fetchData();
  } catch (error: any) {
    console.error('No-show error:', error);
    toast.error(error.message || 'Loi ghi nhan vang mat');
  } finally {
    setProcessing(null);
  }
};
```

### Imports to Add
```tsx
import { CheckinService } from '@/lib/services/checkin.service';
```

### UI Changes
Add secondary button next to "Hoan thanh":

```tsx
{app.status === 'approved' && (
  <div className="flex gap-2 mt-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleNoShow(app.id)}
      disabled={processing === app.id}
      className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
    >
      {processing === app.id ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <UserX className="w-4 h-4 mr-1" />
          Vang mat
        </>
      )}
    </Button>
    <Button
      size="sm"
      variant="default"
      onClick={() => handleMarkComplete(app.id, app.worker_id, jobId)}
      disabled={processing === app.id}
      className="flex-1 bg-primary hover:bg-primary/90"
    >
      ...
    </Button>
  </div>
)}
```

### Imports to Add
```tsx
import { UserX } from 'lucide-react';
```

### Validation
- [ ] "Vang mat" button appears for approved applications
- [ ] Clicking updates status to 'no_show'
- [ ] Worker reliability score decreases by 20
- [ ] Worker account frozen for 7 days
- [ ] Badge changes to reflect no-show status

---

## Task 3: Update Status Badge (30min)

### Files
- `/app/owner/jobs/[id]/applications/page.tsx`

### Changes to `getStatusBadge()` function

Add case for 'no_show':
```typescript
} else if (status === 'no_show') {
  return (
    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-destructive inline-flex items-center gap-1">
      <UserX className="w-3 h-3" />
      Vang mat
    </span>
  );
}
```

### Validation
- [ ] No-show applications display red "Vang mat" badge
- [ ] Completed applications display primary color "Hoan thanh" badge

---

## Success Criteria
- [x] Owner can mark approved application as "completed"
- [x] Owner can mark approved application as "no-show"
- [x] Reliability score updates correctly (+1 complete, -20 no-show)
- [x] Account freeze applied on no-show
- [x] Status badges reflect all states

## Dependencies
- Phase 01 (checkin.service.ts may be modified)

## Risks
- **Medium:** processNoShow already freezes account. Verify business rules align.
