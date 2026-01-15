---
title: "Phase 1: QR Flow Reversal"
status: pending
effort: 1d
priority: P1
---

# Phase 1: QR Flow Reversal

## Context Links
- [Main Plan](./plan.md)
- [Research: QR Flow Analysis](./research/researcher-02-qr-flow-analysis.md)

## Overview

Reverse the QR check-in flow from "Worker generates → Owner scans" to "Owner displays → Worker scans". This is the correct flow for attendance tracking where the job location (owner) has a static QR that workers verify against.

## Key Insights

1. **Database ready**: `job_qr_codes` table and auto-generate trigger already exist
2. **Service ready**: `QRCodeService.generateJobQR()` and `validateJobQR()` implemented
3. **UI swap needed**: Owner page becomes display, Worker page becomes scanner
4. **Validation adds**: Must verify worker is approved for scanned job

## Requirements

### Functional
- Owner sees static QR code for each job (auto-generated on job creation)
- Worker scans QR at job location
- System validates: (1) valid QR, (2) worker approved for that job, (3) not already checked in
- Check-in recorded with timestamp

### Non-Functional
- QR generation <1s
- Scan-to-checkin <2s
- Camera permission UX clear

## Architecture

```
[Worker opens scan page]
    → [Camera activates]
    → [Scans Owner's QR]
    → [Validate QR signature]
    → [Query job_applications WHERE worker=current AND job=qr.job AND status=approved]
    → [If valid] → [Insert checkins record]
    → [Show success with job details]
```

## Related Code Files

| File | Current Purpose | New Purpose |
|------|----------------|-------------|
| `/app/owner/scan-qr/page.tsx` | Scanner (251 LOC) | **Display QR per job** |
| `/app/worker/jobs/[id]/qr/page.tsx` | Display QR (305 LOC) | **Scan owner's QR** |
| `/lib/services/qr-code.service.ts` | Both flows | Use new flow methods |
| `/lib/services/checkin.service.ts` | Check-in logic | Minor updates |
| `/app/owner/jobs/[id]/applications/page.tsx` | Manage apps | Add "View QR" button |

## Implementation Steps

### Step 1: Create Owner QR Display Page (NEW)

Create `/app/owner/jobs/[id]/qr/page.tsx`:
```typescript
// Fetch job_qr_codes.qr_data for this job
// Display QR using base64 image or regenerate client-side
// Show job title, shift time for context
// Add "Share QR" button for printing
```

### Step 2: Update Owner Dashboard Quick Actions

In `/app/owner/dashboard/page.tsx`:
- Change "Quét QR" button to link to job selection → QR display
- OR: Add QR icon on each job card in job list

### Step 3: Convert Worker QR Page to Scanner

Update `/app/worker/jobs/[id]/qr/page.tsx`:
```typescript
// 1. Check worker has approved application for this job
// 2. Show camera scanner (reuse html5-qrcode logic from owner page)
// 3. On scan: validate QR, check approval, record check-in
// 4. Show success/error result
```

Key validation flow:
```typescript
// After QR decoded:
const validation = QRCodeService.validateJobQR(qrText);
if (!validation.valid) return error;

// Check worker is approved for this job
const { data: application } = await supabase
  .from('job_applications')
  .select('id, status')
  .eq('job_id', validation.jobId)
  .eq('worker_id', currentUserId)
  .eq('status', 'approved')
  .single();

if (!application) return error("Bạn chưa được duyệt cho công việc này");

// Check not already checked in
const { data: existing } = await supabase
  .from('checkins')
  .select('id')
  .eq('application_id', application.id)
  .eq('checkin_type', 'check_in')
  .single();

if (existing) return error("Đã check-in trước đó");

// Record check-in
await CheckinService.processCheckIn({
  applicationId: application.id,
  workerId: currentUserId,
  jobId: validation.jobId,
});
```

### Step 4: Update Navigation Links

- Owner: `/owner/scan-qr` → `/owner/jobs` with QR buttons
- Worker: `/worker/jobs/[appId]/qr` route logic changes to scanner

### Step 5: Clean Up Deprecated Code

- Mark legacy QR methods as `@deprecated`
- Add version check in scanner (version: 2 for new flow)
- Keep backward compatibility for 1 release cycle

## Todo List

- [ ] Create `/app/owner/jobs/[id]/qr/page.tsx` - display static QR
- [ ] Add QR button to owner job cards/list
- [ ] Convert `/app/worker/jobs/[id]/qr/page.tsx` to scanner
- [ ] Update check-in validation to use new flow
- [ ] Update navigation links (owner dashboard, worker jobs)
- [ ] Test: owner displays, worker scans, check-in recorded
- [ ] Test: worker not approved → error shown
- [ ] Test: double check-in prevented

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| Owner can view QR for job | QR displays within 1s |
| Worker can scan and check-in | Approved worker → success |
| Unapproved worker blocked | Error message shown |
| Double check-in prevented | "Already checked in" error |
| Check-in recorded | Row in `checkins` table |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Camera permission denied | High | Clear permission UI, manual fallback |
| QR damaged/unreadable | Medium | Manual job ID entry option |
| Network failure during validation | Medium | Queue locally, retry |
| Legacy QR codes still in use | Low | Version check, deprecation warnings |

## Security Considerations

1. **QR Signature**: HMAC-SHA256 prevents tampering
2. **Secret Key Validation**: `job_qr_codes.secret_key` verified
3. **RLS Policies**: Workers can only see QR for approved applications
4. **Rate Limiting**: 2-second cooldown between scans

## Next Steps

After Phase 1 complete:
1. Add geolocation validation (Phase 2)
2. Implement late arrival detection (Phase 2)
3. Consider offline support (Phase 2)
