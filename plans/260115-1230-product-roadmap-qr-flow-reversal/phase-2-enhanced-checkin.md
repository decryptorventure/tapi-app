---
title: "Phase 2: Enhanced Check-in System"
status: pending
effort: 2-3d
priority: P2
---

# Phase 2: Enhanced Check-in System

## Context Links
- [Main Plan](./plan.md)
- [Phase 1: QR Flow Reversal](./phase-1-qr-flow-reversal.md)

## Overview

Enhance check-in with geolocation validation, late arrival detection, and offline support consideration. Builds on Phase 1's reversed QR flow.

## Key Insights

1. **GPS validation exists**: `QRCodeService.validateGPSLocation()` and `CheckinService.validateLocation()` already implemented
2. **Late detection exists**: `CheckinService.processCheckIn()` calculates lateness (>15min threshold)
3. **Reliability scoring**: Already updates based on punctuality (-1, -2 points for late)
4. **Missing**: Integration of GPS into check-in flow, offline queue

## Requirements

### Geolocation Validation
- Capture worker GPS at check-in time
- Compare against restaurant location (from `profiles.restaurant_lat/lng`)
- Allow check-in if within 200m radius (configurable)
- Store location in `checkins.location_lat/lng`

### Late Arrival Detection
- Calculate delay from shift_start_time
- Thresholds: On-time (<15min), Late (15-30min: -1pt), Severe (>30min: -2pt)
- Show worker their lateness status
- Notify owner of late arrivals (optional)

### Offline Support (Consideration)
- Research only: evaluate PWA local storage approach
- Not full implementation in this phase

## Architecture

```
[Worker scans QR]
    → [Validate QR] ✓
    → [Check approval] ✓
    → [Request GPS permission]
    → [Get current location]
    → [Fetch restaurant location from job.owner profile]
    → [Calculate distance]
    → [If within radius] → [Record check-in with location]
    → [If outside radius] → [Show distance, allow override?]
```

## Related Code Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `/lib/services/checkin.service.ts` | Check-in processing | Add GPS integration |
| `/lib/services/qr-code.service.ts` | GPS validation exists | Wire into flow |
| `/app/worker/jobs/[id]/qr/page.tsx` | Scanner page | Add GPS capture UI |
| `/supabase/schema.sql` | DB schema | Add restaurant_lat/lng if missing |

## Implementation Steps

### Step 1: Add Restaurant Location to Profiles

Ensure `profiles` table has:
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS restaurant_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS restaurant_lng DECIMAL(11, 8);
```

Add UI in owner settings to set location (or auto-detect).

### Step 2: Integrate GPS into Check-in Flow

Update worker scanner page:
```typescript
// After QR validation, before check-in:
const getLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    });
  });
};

try {
  const position = await getLocation();
  const workerLat = position.coords.latitude;
  const workerLng = position.coords.longitude;

  // Fetch restaurant location
  const { data: owner } = await supabase
    .from('profiles')
    .select('restaurant_lat, restaurant_lng')
    .eq('id', validation.ownerId)
    .single();

  if (owner?.restaurant_lat && owner?.restaurant_lng) {
    const gpsResult = QRCodeService.validateGPSLocation(
      { latitude: workerLat, longitude: workerLng },
      { latitude: owner.restaurant_lat, longitude: owner.restaurant_lng }
    );

    if (!gpsResult.valid) {
      // Show distance warning, allow override or block
      setLocationWarning(gpsResult.error);
    }
  }

  // Proceed with check-in including location
  await CheckinService.processCheckIn({
    applicationId,
    workerId,
    jobId,
    latitude: workerLat,
    longitude: workerLng
  });
} catch (gpsError) {
  // GPS failed - proceed without location or block?
  console.warn('GPS unavailable:', gpsError);
}
```

### Step 3: Enhanced Late Arrival UI

Update success screen to show:
```typescript
// After check-in success:
if (result.isLate) {
  return (
    <div className="bg-warning/10 rounded-xl p-4">
      <p className="font-medium text-warning">Check-in muộn {result.minutesLate} phút</p>
      <p className="text-sm text-warning/80">
        Điểm tin cậy: -{result.minutesLate > 30 ? 2 : 1}
      </p>
    </div>
  );
}
```

### Step 4: Owner Late Notification (Optional)

Create notification when worker checks in late:
```typescript
// In CheckinService.processCheckIn after isLate detection:
if (isLate && minutesLate > 15) {
  await supabase.from('notifications').insert({
    user_id: job.owner_id,
    type: 'late_checkin',
    title: 'Nhân viên check-in muộn',
    message: `${workerName} đã check-in muộn ${minutesLate} phút cho "${job.title}"`,
    data: { application_id: applicationId, minutes_late: minutesLate }
  });
}
```

### Step 5: Offline Support Research

Evaluate approaches:
1. **Service Worker + IndexedDB**: Queue check-ins locally, sync when online
2. **PWA Background Sync API**: Auto-retry failed requests
3. **Optimistic UI**: Show success immediately, sync later

Recommendation: Defer full offline to future phase. Current MVP requires network.

## Todo List

- [ ] Add `restaurant_lat/lng` columns to profiles (migration)
- [ ] Create owner location settings UI
- [ ] Integrate GPS capture in worker scanner
- [ ] Wire GPS validation into check-in flow
- [ ] Enhance late arrival UI feedback
- [ ] Add owner late notification (optional)
- [ ] Test GPS within radius → success
- [ ] Test GPS outside radius → warning
- [ ] Test GPS unavailable → graceful degradation
- [ ] Document offline support approach (research only)

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| GPS captured at check-in | `checkins.location_lat/lng` populated |
| Within-radius check-in | Success with no warning |
| Outside-radius warning | Distance shown, user informed |
| Late arrival detected | `isLate=true` when >15min |
| Reliability score updated | Points deducted per lateness tier |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| GPS permission denied | High | Allow check-in without location, note in record |
| Inaccurate GPS (indoor) | Medium | 200m radius buffer, WiFi triangulation (future) |
| Restaurant location not set | Medium | Skip validation if missing, prompt owner to set |
| Battery drain from GPS | Low | Single-shot location, not continuous tracking |

## Security Considerations

1. **Location privacy**: Only capture at check-in moment, not track continuously
2. **Spoofing risk**: Consider GPS spoofing detection (future: compare to previous patterns)
3. **Data retention**: Location stored only for audit purposes

## Next Steps

After Phase 2 complete:
1. Implement check-out flow with GPS
2. Add WiFi fingerprinting for indoor accuracy (Phase 3+)
3. Full offline support with sync (Phase 3+)
