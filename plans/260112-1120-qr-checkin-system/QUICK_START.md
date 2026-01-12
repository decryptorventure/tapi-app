# QR Check-in System - Quick Start Guide

## Current State: 85% Complete

Your codebase already has:
- ✅ QR generation (qrcode lib)
- ✅ QR scanning (html5-qrcode lib)
- ✅ HMAC-SHA256 security
- ✅ Worker & Owner UI pages
- ✅ Database integration
- ✅ Reliability scoring

**What's left:** 4 quick security fixes + testing

---

## Files Ready for Review

### Research Report
📄 `/plans/reports/researcher-260112-1120-qr-checkin-flow.md`
- Full security analysis
- Library recommendations
- Gap analysis
- Testing checklist

### Implementation Checklist
📄 `/plans/260112-1120-qr-checkin-system/IMPLEMENTATION_CHECKLIST.md`
- Phase-by-phase tasks
- Code snippets
- Database migrations
- Device testing guide

---

## Top 4 Critical Fixes (Required Before MVP)

### 1. Set QR_SECRET (5 minutes)
```bash
# Generate secure random
openssl rand -hex 16

# Add to .env.local
QR_SECRET=<your-32-char-string>

# Verify in Vercel dashboard
```

**Why:** Without this, all QR codes use default "secret-change-in-production"

**File:** `/lib/services/qr-code.service.ts` line 21
```typescript
private static readonly SECRET = process.env.QR_SECRET || 'default-secret-change-in-production';
```

---

### 2. Prevent QR Double-Scan (30 minutes)
Add `scanned_at` column to track one-time use

**Database Migration:**
```sql
-- supabase/migrations/20260112-add-scanned-at.sql
ALTER TABLE checkins ADD COLUMN scanned_at TIMESTAMP WITH TIME ZONE;
```

**Code Change:** `/lib/services/checkin.service.ts` → `processCheckIn()`
```typescript
// Check if already scanned (NEW)
const { data: existingCheckin } = await supabase
  .from('checkins')
  .select('id')
  .eq('application_id', data.applicationId)
  .eq('checkin_type', 'check_in')
  .not('scanned_at', 'is', null)  // Only count scanned ones
  .single();

if (existingCheckin) {
  return { success: false, message: 'QR code đã được sử dụng' };
}

// After recording check-in (NEW)
await supabase
  .from('checkins')
  .update({ scanned_at: new Date().toISOString() })
  .eq('id', checkin.id);
```

---

### 3. Add Rate Limiting to Scanner (20 minutes)
Prevent rapid-fire scanning of same QR

**File:** `/app/owner/scan-qr/page.tsx` → `handleQRCode()`
```typescript
const [lastScanTime, setLastScanTime] = useState<number>(0);

const handleQRCode = async (qrText: string) => {
  const now = Date.now();
  if (now - lastScanTime < 2000) {
    toast.error('Vui lòng chờ 2 giây trước khi quét tiếp');
    return;
  }

  setLastScanTime(now);
  // ... existing logic
};
```

---

### 4. Add Geolocation to Owner Scanner (25 minutes)
Verify owner is physically at restaurant

**File:** `/app/owner/scan-qr/page.tsx` → add to component
```typescript
const [ownerLocation, setOwnerLocation] = useState<{lat: number; lng: number} | null>(null);

const requestGeolocation = async () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOwnerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success('Vị trí xác nhận');
      },
      (error) => toast.error('Cần cấp quyền vị trí')
    );
  }
};

// Call in startScanner() before starting QR scan
```

---

## Testing Before MVP

### Quick Test (15 minutes)
```bash
# 1. Generate QR on worker phone
# Navigate to: /worker/jobs/[job-id]/qr

# 2. Scan with owner phone
# Navigate to: /owner/scan-qr
# Click "Bắt đầu quét"
# Hold worker phone with QR visible
# Owner scanner should detect in <1 second

# 3. Check database
# Supabase dashboard → checkins table
# Should see new row with check_in type
```

### Full Device Test (2-3 hours)
Required before production launch:

**iOS Testing:**
- iPhone 12+ Safari in PWA mode
- Test 3 QR codes (bright, normal, dim light)
- Test manual input fallback

**Android Testing:**
- Google Pixel or Samsung A-series
- Chrome app, then "Install app"
- Test 3 QR codes
- Test manual input fallback

**Document Results:**
- Camera permission: ✅ Granted / ⚠️ Issues
- QR detection speed: <500ms / ⚠️ Slower
- Check-in recorded: ✅ Yes / ❌ Failed
- Fallback works: ✅ Yes / ⚠️ Needs fix

---

## Architecture Overview

```
Worker Phone:
  /worker/jobs/[id]/qr
    ├─ Fetch application details
    ├─ Generate QR code (qrcode lib)
    └─ Display base64 PNG image

Owner Phone:
  /owner/scan-qr
    ├─ Request camera permission
    ├─ html5-qrcode library scans
    ├─ Validate QR signature
    ├─ Record check-in to database
    └─ Update reliability score

Backend:
  QRCodeService:
    ├─ generateQRCode() → HMAC-SHA256 signed JSON
    └─ validateQRCode() → Verify signature & expiry

CheckinService:
    ├─ processCheckIn() → Record + update score
    ├─ processCheckOut() → Calculate pay
    ├─ updateReliabilityScore()
    └─ validateLocation() → 100m radius check

Database:
  checkins table:
    ├─ application_id (fk)
    ├─ worker_id (fk)
    ├─ job_id (fk)
    ├─ checkin_type ('check_in' | 'check_out')
    ├─ checkin_time
    ├─ scanned_at (NEW - for one-time use)
    └─ location_lat/lng
```

---

## Security Checklist

- ✅ HMAC-SHA256 signature prevents tampering
- ✅ Expiration (shift_start + 2 hours) prevents replay
- ✅ application_id unique per job (no cross-job QR)
- ✅ worker_id verified in QR payload
- ✅ job ownership checked before recording
- ✅ Database RLS policies prevent unauthorized access
- ⚠️ **QR_SECRET must be set** (CRITICAL)
- ⚠️ Geolocation optional for MVP (add later)

---

## Common Issues & Fixes

### Issue: Camera not working on iOS
**Cause:** HTTPS required for camera access
**Fix:** Ensure app is served over HTTPS (Vercel does this)

### Issue: QR scanning very slow
**Cause:** Poor lighting or unfocused camera
**Fix:** Ensure good lighting, clean camera lens

### Issue: Same QR scanned twice
**Cause:** No one-time use check
**Fix:** Apply Fix #2 above (add scanned_at)

### Issue: Wrong owner scanning
**Cause:** No ownership verification
**Fix:** Already implemented (line 157 in scan-qr/page.tsx)

### Issue: Old secrets in production
**Cause:** Forgot to update .env in Vercel
**Fix:** Set QR_SECRET in Vercel dashboard immediately

---

## Implementation Order

```
Day 1 (Morning):
  □ Apply database migration (scanned_at)
  □ Set QR_SECRET environment variable
  □ Test in development environment

Day 1 (Afternoon):
  □ Code: Add one-time use validation
  □ Code: Add rate limiting
  □ Code: Add geolocation

Day 2:
  □ Write unit tests
  □ Device testing (3+ phones)
  □ Fix any issues found

Day 3:
  □ Final verification
  □ Deploy to production
  □ Monitor for 24 hours
```

---

## Deployment Checklist

Before pushing to production:

- [ ] QR_SECRET is NOT "default-secret-change-in-production"
- [ ] Database migration applied to production
- [ ] One-time use validation tested
- [ ] Rate limiting works (2-sec cooldown)
- [ ] Geolocation request working
- [ ] All tests passing
- [ ] Device testing completed (5+ phones)
- [ ] No console errors in browser DevTools

---

## Support Resources

**Need Help?**
1. Check `/plans/reports/researcher-260112-1120-qr-checkin-flow.md` for full details
2. Review code comments in:
   - `/lib/services/qr-code.service.ts`
   - `/lib/services/checkin.service.ts`
   - `/app/owner/scan-qr/page.tsx`
   - `/app/worker/jobs/[id]/qr/page.tsx`

**Unresolved Questions?**
See end of research report for remaining decisions needed

---

## Success Criteria

✅ Task complete when:
- QR generation works without errors
- Owner scanner detects QR in <1 second
- Check-in recorded to database
- Reliability score updated correctly
- One-time use enforcement working
- Rate limiting preventing rapid scans
- Device testing passing on 5+ phones
- Error rate <1% in production

---

**Status:** Ready for implementation
**Next:** Assign to developer, follow IMPLEMENTATION_CHECKLIST.md
