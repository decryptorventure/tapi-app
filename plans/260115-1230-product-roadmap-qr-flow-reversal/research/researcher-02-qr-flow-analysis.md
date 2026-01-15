# QR Code Flow Analysis - Current Implementation

**Date:** 2026-01-15
**Status:** COMPLETE
**Scope:** Current flow mapping for flow reversal planning

---

## Executive Summary

Current Tapy QR flow: **Worker generates QR → Owner scans**
Target flow: **Owner generates QR → Worker scans**

Current implementation is secure, production-ready. Reversal requires table schema changes + UI/service refactoring.

---

## 1. Current QR Generation Logic

**Who generates:** Worker (on client-side)
**Where:** `/app/worker/jobs/[id]/qr/page.tsx`
**Trigger:** Worker views approved job application

### Data Structure
```typescript
interface QRCodeData {
  application_id: string;     // Job application UUID
  worker_id: string;          // Worker's auth.uid()
  job_id: string;             // Job UUID
  expires_at: string;         // shift_start_time + 2 hours
  signature: string;          // HMAC-SHA256(data, QR_SECRET)
}
```

### Generation Code
- **Service:** `lib/services/qr-code.service.ts`
- **Method:** `QRCodeService.generateQRCode(applicationId, workerId, jobId, expiryDate)`
- **Output:** Base64 PNG image (data URL)
- **Security:** HMAC-SHA256 signature prevents tampering

### Expiration Logic
- Calculated as: `shift_start_time + 2 hours`
- Hard stop—no scanning after expiration
- No refresh mechanism exists

---

## 2. Current Scanning Logic

**Who scans:** Owner (using camera)
**Where:** `/app/owner/scan-qr/page.tsx`
**Library:** `html5-qrcode` (v2.3.8)

### Scanning Flow
1. Owner clicks "Bắt đầu quét" → requests camera permission
2. Continuous scanning at 10 fps
3. On detection → calls `handleQRCode(qrText)`

### Validation Steps (Lines 119-227)
```
1. Rate limiting check (2-second cooldown)
2. QRCodeService.validateQRCode() → verify signature + expiration
3. Fetch job_applications record → verify belongs to application
4. Verify job belongs to owner (ownership check)
5. Check application status = 'approved'
6. Record check-in to checkins table
7. Display success with worker name + job title
```

### Database Insert
```typescript
const { error: checkinError } = await supabase
  .from('checkins')
  .insert({
    application_id: app.id,
    worker_id: app.worker_id,
    job_id: app.job_id,
    checkin_type: 'check_in',
    checkin_time: new Date().toISOString(),
  });
```

---

## 3. Database Schema - Current & Target

### Current Tables

**job_applications** (Worker supplies data)
- `id, job_id, worker_id, status, applied_at, approved_at, ...`
- Links: Worker → Job application record

**checkins** (Records attendance)
- `id, application_id, worker_id, job_id, checkin_type, checkin_time, location_lat?, location_lng?`
- Indexes: `(application_id, checkin_type)` for one-time checks

### NEW: job_qr_codes Table (From Migration 20260115)
```sql
CREATE TABLE public.job_qr_codes (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id),
  qr_data TEXT NOT NULL,           -- JSON payload for reversal
  secret_key TEXT NOT NULL,         -- Validation key
  qr_type VARCHAR(20) DEFAULT 'static',
  is_active BOOLEAN DEFAULT TRUE,
  created_at, updated_at TIMESTAMP
  UNIQUE(job_id)  -- One QR per job
);
```

### RLS Policies (Reversal)
- Owners: Can manage their job QR codes
- Workers: Can view QR for approved applications only

---

## 4. Files Requiring Modification

### For Flow Reversal

**Frontend (UI Changes)**
1. `/app/worker/jobs/[id]/qr/page.tsx` → Display owner's QR, not generate
2. `/app/owner/scan-qr/page.tsx` → Change to generate + display (NOT scan)
3. `/app/owner/jobs/[id]/detail.tsx` → Add QR generation UI

**Backend (Service Changes)**
1. `lib/services/qr-code.service.ts` → Add `generateOwnerQRCode()` method
2. New API route: `/api/owner/jobs/[id]/qr` → Generate + store QR

**Database**
1. `supabase/migrations/20260115_qr_checkin_refactor.sql` → Already created `job_qr_codes`
2. Add trigger to auto-generate QR when job created (ALREADY EXISTS in migration)

**Other Affected Files**
- `lib/services/checkin.service.ts` → Adapt for owner-generated QR context
- `app/owner/jobs/[id]/applications/page.tsx` → Show check-in status

---

## 5. Key Technical Changes

### Payload Changes
**Current (Worker generates):**
```json
{ "application_id": "...", "worker_id": "...", "job_id": "...", "expires_at": "...", "signature": "..." }
```

**Target (Owner generates):**
```json
{ "job_id": "...", "owner_id": "...", "created_at": "...", "signature": "..." }
```
- Simpler: no application_id or worker_id embedded
- Validation: Owner queries `job_qr_codes`, then checks if worker is approved for that job

### Validation Flow Reversal
**Current:** Worker QR → Owner verifies worker eligibility
**Target:** Owner QR → Worker proves eligibility via `job_applications` table lookup

---

## 6. Implementation Sequence

1. **Prep (Already Done)**
   - Migration `20260115_qr_checkin_refactor.sql` created `job_qr_codes` table
   - Auto-generate trigger exists on jobs table

2. **Backend** (Next)
   - Add `generateOwnerQRCode()` to QRCodeService
   - Create `/api/owner/jobs/[id]/qr` endpoint
   - Update `handleQRCode()` validation logic

3. **Frontend**
   - Update `/app/worker/jobs/[id]/qr/page.tsx` to fetch owner's QR from DB
   - Update `/app/owner/scan-qr/page.tsx` to scanning page (OR rename to generation)
   - Add QR display to owner job detail page

4. **Testing**
   - Validate signature with owner secret
   - Test idempotency (same QR multiple scans)
   - Verify RLS policies (worker sees only approved jobs)

---

## 7. Critical Considerations

### One-Time Use Prevention
- Current: `scanned_at` timestamp (migration 011) prevents double-scan
- Target: Same mechanism applies to owner QR

### Expiration
- Current: shift_start + 2 hours
- Target: Consider longer TTL (job creation to shift_end)

### Offline Support
- Not currently implemented (requires local validation)
- Flow reversal doesn't change this requirement

### Geolocation
- Owner scanner should capture location for verification
- Currently missing—add before full reversal

---

## Unresolved Questions

1. When should owner QR expire? Job lifetime? Shift end? Configurable?
2. Should multiple workers scan same job's QR (yes, but only approved)?
3. Should QR be static (unchanging) or dynamic (regenerated per shift)?
4. How to handle late registrations (jobs created, workers apply late)?
5. Fallback for camera failure—show job_id or keep application_id?

---

**Next:** Implementation plan in `/plans/260115-1230-product-roadmap-qr-flow-reversal/`
