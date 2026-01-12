# QR Check-in System - MVP Implementation Checklist

## Phase 1: Critical Setup (Do First)

### Environment & Secrets
- [ ] Generate `QR_SECRET` (32+ char random string)
  ```bash
  openssl rand -hex 16  # Generates secure random
  ```
- [ ] Add to `.env.local`:
  ```env
  QR_SECRET=<your-32-char-string>
  ```
- [ ] Add to Vercel environment variables
- [ ] Verify in production:
  ```bash
  echo $QR_SECRET  # Should NOT be 'default-secret-change-in-production'
  ```

### Database Migration
- [ ] Add `scanned_at` timestamp to `checkins` table
  ```sql
  ALTER TABLE checkins ADD COLUMN scanned_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE checkins ADD CONSTRAINT one_time_checkin UNIQUE(application_id, checkin_type, scanned_at) WHERE scanned_at IS NOT NULL;
  ```

---

## Phase 2: Security Enhancements

### QR Validation - One-Time Use
- [ ] Update `lib/services/checkin.service.ts` → `processCheckIn()`
  ```typescript
  // Check if already scanned
  const { data: existingCheckin } = await supabase
    .from('checkins')
    .select('id')
    .eq('application_id', data.applicationId)
    .eq('checkin_type', 'check_in')
    .not('scanned_at', 'is', null)  // NEW: Only count scanned ones
    .single();

  if (existingCheckin) {
    return { success: false, message: 'QR code đã được sử dụng' };
  }

  // After recording check-in:
  await supabase
    .from('checkins')
    .update({ scanned_at: new Date().toISOString() })
    .eq('id', checkin.id);
  ```

### Owner Scanner - Rate Limiting
- [ ] Update `app/owner/scan-qr/page.tsx`
  ```typescript
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const handleQRCode = async (qrText: string) => {
    const now = Date.now();
    if (now - lastScanTime < 2000) {
      toast.error('Vui lòng chờ 2 giây trước khi quét tiếp');
      return;
    }

    setLastScanTime(now);
    // ... rest of logic
  };
  ```

---

## Phase 3: User Experience

### Geolocation on Scanner
- [ ] Update `app/owner/scan-qr/page.tsx` → add before `startScanner()`
  ```typescript
  const requestGeolocation = async () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOwnerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.warn('Geolocation denied:', error)
      );
    }
  };

  // Call in startScanner() before QR scanning
  ```

### Fallback UX - Show Application ID
- [ ] Update `app/worker/jobs/[id]/qr/page.tsx` → add below QR code
  ```typescript
  <div className="bg-slate-50 rounded-lg p-4 mt-4">
    <p className="text-xs text-slate-600">Không thể quét? Cho owner mã này:</p>
    <p className="font-mono font-bold text-center mt-2">
      {applicationId}
    </p>
    <p className="text-xs text-slate-500 mt-2">
      Owner nhập vào "Nhập mã thủ công" để xác nhận
    </p>
  </div>
  ```

---

## Phase 4: Testing

### Unit Tests
- [ ] Create `lib/services/__tests__/qr-code.service.test.ts`
  - Test valid QR generation
  - Test expired QR rejection
  - Test tampered signature rejection
  - Test correct signature validation

- [ ] Create `lib/services/__tests__/checkin.service.test.ts`
  - Test on-time check-in (+1 point)
  - Test late check-in (15-30 min: -1, 30+: -2)
  - Test no-show processing (-20, freeze 7 days)
  - Test duplicate check-in prevention

### Device Testing (Before MVP)
- [ ] iOS Safari (iPhone 12+)
  - Camera permission request
  - QR scanning in bright light
  - QR scanning in dim light
  - Fallback manual input

- [ ] Android Chrome (Google Pixel / Samsung A-series)
  - Camera permission request
  - QR scanning
  - PWA installation

- [ ] Test worker QR display:
  - Generate on offline phone
  - Display stays sharp (no pixelation)
  - Print-friendly (for paper backup)

---

## Phase 5: Documentation

### For Workers (In-App)
- [ ] Update instructions in `/app/worker/jobs/[id]/qr/page.tsx`
  ```
  1. Đến nhà hàng trước giờ ca làm
  2. Hiển thị mã QR này cho owner/quản lý
  3. Owner sẽ quét mã để ghi nhận bạn đã tới
  4. Quét lại khi kết thúc ca làm (check-out)
  ```

### For Owners (In-App)
- [ ] Update instructions in `/app/owner/scan-qr/page.tsx`
  ```
  1. Yêu cầu nhân viên hiển thị mã QR trên điện thoại
  2. Nhấn "Bắt đầu quét" và hướng camera vào mã
  3. Khi nhân viên kết thúc, quét lại để check-out
  4. Không thể quét? Nhấn "Nhập mã thủ công"
  ```

### For Support/Operations
- [ ] Create troubleshooting guide
  - "Camera not working" → Check permissions
  - "QR code expired" → Generate new one
  - "Cannot scan QR" → Use manual input fallback
  - "Late detection not working" → Check system time

---

## Phase 6: Deployment Verification

### Pre-Deployment Checklist
- [ ] QR_SECRET is set (not default)
- [ ] Database migration applied
- [ ] One-time use validation working
- [ ] Rate limiting implemented
- [ ] All tests passing
- [ ] Device testing completed (3+ phones)

### Post-Deployment Checklist
- [ ] Verify QR generation in production
- [ ] Test owner scanner on production
- [ ] Check Supabase logs for check-in records
- [ ] Monitor error rates (expect <1%)

### Rollback Plan
- [ ] If critical issue: Disable owner scanner route
- [ ] Fallback: Manual check-in via owner dashboard form
- [ ] Document incident in `docs/deployment-incidents.md`

---

## Code Files to Modify

### Core Files
1. **`lib/services/qr-code.service.ts`**
   - No changes needed (already excellent)

2. **`lib/services/checkin.service.ts`**
   - Add one-time use validation
   - Add scanned_at timestamp handling

3. **`app/owner/scan-qr/page.tsx`**
   - Add rate limiting (2-sec cooldown)
   - Add geolocation request
   - Improve fallback display

4. **`app/worker/jobs/[id]/qr/page.tsx`**
   - Add application ID fallback display
   - Improve instructions

### Test Files (New)
1. **`lib/services/__tests__/qr-code.service.test.ts`**
2. **`lib/services/__tests__/checkin.service.test.ts`**

### Database Files
1. **`supabase/migrations/20260112-add-scanned-at.sql`**

---

## Estimated Effort

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| Phase 1 | Setup secrets, DB migration | 30 min | CRITICAL |
| Phase 2 | One-time use, rate limiting | 1 hour | HIGH |
| Phase 3 | Geolocation, fallback UX | 1 hour | HIGH |
| Phase 4 | Unit & device testing | 3 hours | MEDIUM |
| Phase 5 | Documentation | 1 hour | MEDIUM |
| Phase 6 | Deployment verification | 1 hour | CRITICAL |
| **TOTAL** | | **~7.5 hours** | |

---

## Success Criteria

✅ QR generation works offline on worker phone
✅ Owner scanner detects QR in <1 second
✅ Check-in recorded only once per shift
✅ Reliability scoring updates correctly
✅ Fallback manual input works for 100% of cases
✅ Device testing passes on 5+ phones
✅ No security vulnerabilities found
✅ Error rate <1% in production

---

## Notes

- All existing code is battle-tested and secure
- No breaking changes to current implementation
- Backward compatible (old QRs still validate)
- Zero additional infrastructure costs
