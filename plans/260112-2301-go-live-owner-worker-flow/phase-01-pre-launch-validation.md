# Phase 1: Pre-Launch Validation

## Context

- [Main Plan](./plan.md)
- [Research: Marketplace Go-Live](./research/researcher-01-marketplace-golive.md)
- [Research: Owner-Worker Flow UX](./research/researcher-02-owner-worker-flow-ux.md)

## Overview

Validate all critical operational flows before exposing to real users. Focus on edge cases that destroy trust if failed: unqualified workers auto-booking, QR check-in failures, incorrect reliability scoring.

## Key Insights

1. **Instant-book algorithm is single point of failure** - false positives book unqualified workers, owners lose trust immediately
2. **QR check-in under poor network** - Vietnam 4G varies; must work offline
3. **Reliability scoring accuracy** - if timestamps wrong, scores wrong, trust collapses
4. **Notification delivery** - workers need <30s confirmation after booking

---

## Requirements

### R1: Instant Book Algorithm Validation

**Current Implementation:** `/lib/job-matching.ts`

Test 50+ edge cases:
- [ ] Expired language certificate (verified_at > 2 years)
- [ ] Pending verification status (should allow? current: yes)
- [ ] Score at exactly min threshold (e.g., 90 = 90)
- [ ] Frozen account with expired freeze date
- [ ] Worker with multiple language skills (picks correct one)
- [ ] JLPT N3 applying for N4 job (should pass)
- [ ] TOPIK 3 applying for TOPIK 4 job (should fail)
- [ ] Worker reliability 89 for job requiring 90
- [ ] is_verified = false blocks instant book
- [ ] Worker applies to already-filled job (max_workers reached)

**Expected Output:** 100% pass rate on edge cases

### R2: QR Check-in System Validation

**Current Implementation:**
- `/lib/services/qr-code.service.ts`
- `/lib/services/checkin.service.ts`

Test scenarios:
- [ ] QR generation with valid HMAC signature
- [ ] QR validation with tampered data (should reject)
- [ ] QR expired (shift_start + 1h passed)
- [ ] Duplicate check-in attempt (should block)
- [ ] Check-in 5 min before shift (should succeed)
- [ ] Check-in 15 min late (mild penalty: -2)
- [ ] Check-in 30+ min late (severe penalty: -2)
- [ ] Check-out without check-in (should fail)
- [ ] Location validation: worker 50m from restaurant (pass)
- [ ] Location validation: worker 150m from restaurant (fail)

**Environment Variable Check:**
- [ ] `QR_SECRET` is set in production (not default)

### R3: Reliability Scoring Accuracy

**Current Implementation:**
- `/lib/services/checkin.service.ts` - `updateReliabilityScore()`
- `/supabase/schema.sql` - `update_reliability_score()` function

Validate scoring logic:
- [ ] On-time check-in: +1 point
- [ ] Late check-in (15-30 min): -1 point
- [ ] Late check-in (>30 min): -2 point
- [ ] Job completion: +1 point
- [ ] No-show: -20 points + 7-day freeze
- [ ] Score capped at 0 and 100
- [ ] reliability_history table logs all changes
- [ ] Freeze ends after 7 days (account unfrozen)

### R4: Owner Dashboard Flows

**Pages to Test:**
- `/app/owner/dashboard/page.tsx`
- `/app/owner/jobs/page.tsx`
- `/app/owner/jobs/new/page.tsx`
- `/app/owner/jobs/[id]/applications/page.tsx`
- `/app/owner/scan-qr/page.tsx`

Test scenarios:
- [ ] Create job with all required fields
- [ ] View pending applications list
- [ ] Approve application -> QR generated
- [ ] Reject application -> worker notified (future: push)
- [ ] Scan worker QR -> check-in recorded
- [ ] View job statistics (current_workers count)

### R5: Worker Flow Validation

**Pages to Test:**
- `/app/worker/feed/page.tsx`
- `/app/worker/job/[id]/page.tsx`
- `/app/worker/jobs/[id]/qr/page.tsx`
- `/app/worker/dashboard/page.tsx`

Test scenarios:
- [ ] Job feed filters by language correctly
- [ ] Job detail shows Instant Book vs Request to Book
- [ ] Apply to job -> correct status assigned
- [ ] View QR code after approval
- [ ] Dashboard shows upcoming shifts

### R6: Database & RLS Policies

**Schema:** `/supabase/schema.sql`

Validate RLS isolation:
- [ ] Owner A cannot see Owner B's jobs
- [ ] Worker can view open jobs only
- [ ] Worker sees only own applications
- [ ] Owner sees applications for own jobs only
- [ ] No data leakage on checkins table

### R7: Notification Readiness

**Not implemented yet** - prepare for Phase 2:
- [ ] Document FCM/Supabase push notification setup
- [ ] Identify trigger points (booking approved, reminder)
- [ ] SMS fallback provider (Twilio/Vietnam SMS gateway)

---

## Related Code Files

| Purpose | Path |
|---------|------|
| Job Matching Logic | `/lib/job-matching.ts` |
| Check-in Service | `/lib/services/checkin.service.ts` |
| QR Code Service | `/lib/services/qr-code.service.ts` |
| Job Application Service | `/lib/services/job-application.service.ts` |
| Verification Service | `/lib/services/verification.service.ts` |
| Database Schema | `/supabase/schema.sql` |
| Owner Dashboard | `/app/owner/dashboard/page.tsx` |
| Worker Feed | `/app/worker/feed/page.tsx` |
| QR Display | `/app/worker/jobs/[id]/qr/page.tsx` |
| QR Scanner | `/app/owner/scan-qr/page.tsx` |

---

## Implementation Steps

### Step 1: Create Test Suite for Job Matching (1h)
1. Create `/tests/job-matching.test.ts`
2. Implement 50 edge case scenarios
3. Run and document results
4. Fix any failing cases

### Step 2: QR System Security Audit (30m)
1. Verify HMAC signature generation
2. Test expiration enforcement
3. Verify one-time QR usage (duplicate block)
4. Confirm `QR_SECRET` production setup

### Step 3: Reliability Scoring Verification (30m)
1. Create test scenarios with mock data
2. Verify point changes match spec
3. Check freeze/unfreeze logic
4. Validate history logging

### Step 4: End-to-End Flow Testing (45m)
1. Owner: create job -> view applications -> approve -> scan QR
2. Worker: browse feed -> apply -> view QR -> check-in
3. Complete shift: check-out -> verify score update
4. No-show: trigger no-show -> verify -20 and freeze

### Step 5: RLS Policy Audit (15m)
1. Test cross-user data access attempts
2. Verify owner-worker isolation
3. Document any gaps

---

## Todo List

- [ ] Test instant-book algorithm with 50+ edge cases
- [ ] Validate QR generation and signature verification
- [ ] Test QR expiration and duplicate check-in blocking
- [ ] Verify reliability scoring: +1, -2, -20 scenarios
- [ ] Test 7-day freeze and auto-unfreeze
- [ ] Run full owner flow: job create -> approve -> scan
- [ ] Run full worker flow: browse -> apply -> check-in/out
- [ ] Audit RLS policies for data isolation
- [ ] Confirm QR_SECRET is set for production
- [ ] Document notification trigger points for Phase 2

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Instant-book edge case pass rate | 100% |
| QR validation accuracy | 100% |
| Reliability scoring accuracy | 100% |
| RLS data isolation | Zero leakage |
| E2E flows complete | Owner + Worker |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Edge case not covered | Unqualified worker booked | Add to test suite, re-run |
| QR_SECRET exposed | Security breach | Rotate key, audit access |
| Scoring bug | Trust collapse | Manual review of 10 test shifts |
| RLS gap | Data leak | Penetration test before launch |

---

## Next Steps

After Phase 1 complete:
1. Deploy to staging environment
2. Recruit 10-15 restaurant partners
3. Onboard 50-100 test workers
4. Begin [Phase 2: Soft Launch](./phase-02-soft-launch.md)
