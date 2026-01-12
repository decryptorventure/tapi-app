# Phase 01: QR Security Fixes

**Effort:** 4h | **Priority:** P1 (Critical) | **Status:** Pending

## Objective
Harden QR check-in system: secure secret, prevent double-scan, add rate limiting.

---

## Task 1: Set QR_SECRET Environment Variable (30min)

### Problem
`/lib/services/qr-code.service.ts` line 21 uses fallback secret:
```typescript
private static readonly SECRET = process.env.QR_SECRET || 'default-secret-change-in-production';
```

### Solution
1. Generate secure secret:
   ```bash
   openssl rand -hex 16
   ```
2. Add to `.env.local`:
   ```
   QR_SECRET=<generated-32-char-string>
   ```
3. Add to Vercel dashboard (Production + Preview)
4. Add to `.env.local.example` with placeholder

### Validation
- [ ] App starts without error
- [ ] QR code generates successfully
- [ ] QR code validates correctly

---

## Task 2: Add `scanned_at` Column (30min)

### Files
- `supabase/migrations/20260112-add-scanned-at.sql` (NEW)

### SQL Migration
```sql
-- Add scanned_at column to track one-time QR use
ALTER TABLE checkins ADD COLUMN scanned_at TIMESTAMP WITH TIME ZONE;

-- Index for faster lookup
CREATE INDEX idx_checkins_scanned_at ON checkins(application_id, checkin_type)
WHERE scanned_at IS NOT NULL;
```

### Validation
- [ ] Migration runs without error
- [ ] Column appears in Supabase dashboard

---

## Task 3: Implement One-Time Use Validation (1h)

### Files
- `/lib/services/checkin.service.ts`

### Changes to `processCheckIn()`

Before "Record check-in" block (~line 56), add:
```typescript
// Check if QR already used (one-time enforcement)
const { data: existingScanned } = await supabase
  .from('checkins')
  .select('id, scanned_at')
  .eq('application_id', data.applicationId)
  .eq('checkin_type', 'check_in')
  .not('scanned_at', 'is', null)
  .single();

if (existingScanned) {
  return { success: false, message: 'Mã QR đã được sử dụng' };
}
```

After successful insert (~line 80), add:
```typescript
// Mark QR as used
await supabase
  .from('checkins')
  .update({ scanned_at: new Date().toISOString() })
  .eq('id', checkin.id);
```

### Validation
- [ ] First scan succeeds
- [ ] Second scan fails with "Mã QR đã được sử dụng"
- [ ] Database shows scanned_at populated

---

## Task 4: Add Rate Limiting to Scanner (1h)

### Files
- `/app/owner/scan-qr/page.tsx`

### Changes
Add state near top of component:
```typescript
const [lastScanTime, setLastScanTime] = useState<number>(0);
const SCAN_COOLDOWN_MS = 2000; // 2 second cooldown
```

In `handleQRCode()` or equivalent scan handler, add at start:
```typescript
const now = Date.now();
if (now - lastScanTime < SCAN_COOLDOWN_MS) {
  toast.error('Vui lòng chờ 2 giây trước khi quét tiếp');
  return;
}
setLastScanTime(now);
```

### Validation
- [ ] Rapid scans blocked with toast message
- [ ] 2-second wait allows next scan
- [ ] Normal scanning workflow unaffected

---

## Task 5: Add Startup Validation (30min)

### Files
- `/lib/services/qr-code.service.ts`

### Changes
Add validation method and call on service load:
```typescript
private static validateSecret(): void {
  const secret = process.env.QR_SECRET;
  if (!secret || secret === 'default-secret-change-in-production') {
    console.error('[QR] CRITICAL: QR_SECRET not set or using default value');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('QR_SECRET must be configured in production');
    }
  }
}

// Call in static block or first method call
static {
  if (typeof window === 'undefined') {
    this.validateSecret();
  }
}
```

### Validation
- [ ] Dev mode: warning logged if secret missing
- [ ] Prod mode: throws error if secret missing

---

## Success Criteria
- [x] QR_SECRET env var set in production
- [x] Database migration applied
- [x] One-time use enforced
- [x] Rate limiting prevents rapid scans
- [x] Startup validation warns/errors on missing secret

## Dependencies
- Supabase access for migration
- Vercel access for env vars

## Risks
- **Low:** Migration may conflict if other changes pending. Mitigation: coordinate with team.
