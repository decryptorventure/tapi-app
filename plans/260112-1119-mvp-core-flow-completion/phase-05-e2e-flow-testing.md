# Phase 05: End-to-End Flow Testing

**Effort:** 3h | **Priority:** P1 | **Status:** Pending

## Objective
Validate complete hiring flow works from job posting to job completion.

---

## Test Scenarios

### Scenario 1: Instant Book Happy Path (45min)

**Preconditions:**
- Worker account with verified Japanese N3
- Reliability score >= 90
- Identity verified (intro video uploaded)
- Account not frozen

**Steps:**
1. Owner logs in
2. Owner creates job: Japanese N3 required, min reliability 90
3. Worker logs in
4. Worker views job feed, finds job
5. Verify "Instant Book" button shown (green)
6. Verify qualification feedback shows "Ban du dieu kien Dat ngay!"
7. Worker clicks "Instant Book"
8. Verify toast: application created
9. Worker navigates to /worker/jobs
10. Verify job appears in "Sap toi" (Upcoming) tab
11. Worker clicks job -> "Xem ma QR"
12. Verify QR code displays
13. Owner navigates to /owner/scan-qr
14. Owner scans worker's QR
15. Verify check-in success toast
16. Verify database: checkins row created
17. Owner navigates to job applications
18. Owner clicks "Hoan thanh"
19. Verify application status = 'completed'
20. Verify worker reliability score += 1

**Expected Results:**
- [x] All steps complete without error
- [x] Application status transitions: approved -> completed
- [x] Reliability score increases

---

### Scenario 2: Request-to-Book Flow (45min)

**Preconditions:**
- Worker with unverified language skill OR low reliability score

**Steps:**
1. Owner creates job: Japanese N2, min reliability 95
2. Worker (with N3 or score 85) views job
3. Verify "Gui yeu cau" button shown (not Instant Book)
4. Verify qualification feedback shows specific reasons:
   - "Trinh do ngon ngu chua dat yeu cau" if N3 < N2
   - "Diem tin cay chua du" if score < 95
5. Worker clicks "Gui yeu cau"
6. Verify toast: request sent
7. Worker sees job in "Cho duyet" (Pending) tab
8. Owner navigates to /owner/jobs/[id]/applications
9. Owner sees application with "Cho duyet" badge
10. Owner clicks "Duyet"
11. Verify QR generated (application.qr_token populated)
12. Worker refreshes /worker/jobs
13. Verify job moved to "Sap toi" tab
14. Continue from step 11 of Scenario 1

**Expected Results:**
- [x] Worker sees specific qualification feedback
- [x] Manual approval flow works
- [x] QR generated on approval

---

### Scenario 3: No-Show Handling (30min)

**Preconditions:**
- Worker with approved application
- Worker does NOT check in

**Steps:**
1. Complete approval flow from Scenario 2
2. Owner waits past shift start time
3. Owner navigates to applications
4. Owner clicks "Vang mat" on worker
5. Verify confirmation (if implemented) or immediate action
6. Verify application status = 'no_show'
7. Verify worker reliability score -= 20
8. Verify worker account frozen for 7 days
9. Worker logs in
10. Verify worker cannot apply to new jobs (frozen message)

**Expected Results:**
- [x] No-show correctly penalizes worker
- [x] Account freeze prevents new applications

---

### Scenario 4: QR Security (30min)

**Steps:**
1. Worker gets approved application with QR
2. Owner scans QR first time -> success
3. Owner immediately scans same QR again
4. Verify error: "Ma QR da duoc su dung"
5. Rapidly spam scan button
6. Verify rate limit toast: "Vui long cho 2 giay"
7. Check Vercel env vars include QR_SECRET
8. Verify QR_SECRET != 'default-secret-change-in-production'

**Expected Results:**
- [x] One-time use enforced
- [x] Rate limiting works
- [x] Production secret configured

---

### Scenario 5: Edge Cases (30min)

**5a: Job at capacity**
1. Create job with max_workers = 1
2. First worker applies (Instant Book)
3. Verify job.current_workers = 1
4. Second worker views job
5. Verify job no longer appears in feed OR shows "Da du nguoi"

**5b: Frozen account**
1. Worker with frozen account tries to apply
2. Verify cannot click apply button OR error message shown

**5c: Expired QR**
1. Modify application to have expired QR (shift_start + 2h passed)
2. Try to scan
3. Verify error: "Ma QR da het han"

**Expected Results:**
- [x] Capacity limits respected
- [x] Frozen accounts blocked
- [x] Expired QR rejected

---

## Test Data Setup Script

```sql
-- Create test owner
INSERT INTO profiles (id, full_name, user_type, restaurant_name)
VALUES ('owner-test-1', 'Test Owner', 'owner', 'Test Restaurant');

-- Create test worker (qualifies for Instant Book)
INSERT INTO profiles (id, full_name, user_type, reliability_score, is_verified, is_account_frozen)
VALUES ('worker-test-1', 'Test Worker Good', 'worker', 95, true, false);

INSERT INTO language_skills (worker_id, language_type, level, verification_status)
VALUES ('worker-test-1', 'japanese', 'n2', 'verified');

-- Create test worker (does NOT qualify)
INSERT INTO profiles (id, full_name, user_type, reliability_score, is_verified, is_account_frozen)
VALUES ('worker-test-2', 'Test Worker Low', 'worker', 80, false, false);

INSERT INTO language_skills (worker_id, language_type, level, verification_status)
VALUES ('worker-test-2', 'japanese', 'n4', 'pending');

-- Create test job
INSERT INTO jobs (id, owner_id, title, required_language, required_language_level, min_reliability_score, shift_date, shift_start_time, shift_end_time, hourly_rate_vnd, max_workers, status)
VALUES (
  'job-test-1',
  'owner-test-1',
  'Test Waiter Position',
  'japanese',
  'n3',
  90,
  CURRENT_DATE + INTERVAL '1 day',
  '10:00:00',
  '14:00:00',
  80000,
  2,
  'open'
);
```

---

## Checklist Summary

### Before Testing
- [ ] QR_SECRET set in .env.local
- [ ] Database migration applied (scanned_at column)
- [ ] All Phase 1-4 code changes deployed to dev

### During Testing
- [ ] Scenario 1: Instant Book
- [ ] Scenario 2: Request-to-Book
- [ ] Scenario 3: No-Show
- [ ] Scenario 4: QR Security
- [ ] Scenario 5: Edge Cases

### After Testing
- [ ] All scenarios pass
- [ ] No console errors
- [ ] Database state consistent
- [ ] Document any bugs found

---

## Success Criteria
- [x] All 5 scenarios pass
- [x] No critical bugs blocking MVP
- [x] Performance acceptable (< 2s page loads)
- [x] Mobile browsers tested (iOS Safari, Android Chrome)

## Dependencies
- Phases 1-4 complete
- Test data available

## Risks
- **Medium:** May discover bugs requiring Phase 1-4 rework. Budget 1h buffer.
