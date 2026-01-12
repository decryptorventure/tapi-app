# MVP Owner-Worker UX Flow Analysis
**Date:** Jan 12, 2026 | **Status:** Research Report | **Scope:** Tapy Recruitment Platform

---

## EXECUTIVE SUMMARY

**Finding:** Current MVP has minimal friction for Instant Book flow (worker's happy path) but lacks critical post-MVP features that *appear* in MVP architecture. Request-to-Book flow needs clarity on owner responsibilities.

**Key Issue:** Docs describe "QR code generation" and "check-in validation" as MVP features, but these are Phase 2 (Feb 2026). This creates confusion on actual MVP scope.

**Recommendation:** Simplify MVP to pure job-to-completion without geolocation. Add features incrementally, not speculatively.

---

## MINIMUM VIABLE FLOW (MVP)

### Worker Path: 4 steps
```
1. DISCOVER: View job feed (open jobs only)
2. APPLY: Click "Instant Book" or "Request to Book"
3. WAIT: Instant Book = done. Request = wait for owner approval
4. COMPLETE: Job complete, reliability score updates
```

### Owner Path: 3 steps
```
1. POST: Create job (required: language, level, rate, date/time)
2. MANAGE: Approve pending applications (Request-to-Book only)
3. VERIFY: Mark job complete when worker shows up
```

**Scope Boundary:** NO geolocation, NO QR scanning, NO wallet. Pure hiring + completion tracking.

---

## FRICTION POINT ANALYSIS

### WORKER FLOW

**✓ SMOOTH:**
- Job discovery minimal (filters work client-side, fast)
- Instant Book instant feedback
- No profile completion blocking MVP (workers can apply with 80%+ completion)

**⚠ FRICTION DETECTED:**
1. **Qualification ambiguity** - Worker doesn't know why they don't qualify for Instant Book
   - *Issue:* `getQualificationFeedback()` provides feedback, but JobCard UI doesn't show it
   - *Fix:* Display "You qualify for Instant Book" OR "Missing: [requirement]" before apply

2. **Profile completion banner** - Shows missing items but doesn't contextualize urgency
   - *Issue:* Worker sees "Verify language" but doesn't know this blocks Instant Book
   - *Fix:* Link missing items to job eligibility

3. **No status tracking post-apply** - Worker has no dashboard to see application status
   - *Issue:* After apply, worker lost (no "View my applications" UI)
   - *Fix:* MVP requires `/worker/dashboard` showing: active jobs, status, upcoming shifts

### OWNER FLOW

**✓ SMOOTH:**
- Job posting UI clear and guided (completion progress indicator)
- Language/level required for Instant Book logic

**⚠ FRICTION DETECTED:**
1. **Request-to-Book approval workflow undefined**
   - *Issue:* Docs say owner can approve pending apps, but no UI exists
   - *Fix:* MVP needs `/owner/jobs/[id]/applications` with approve/reject buttons

2. **Job completion verification missing**
   - *Issue:* How does owner mark job complete? Current code has no endpoint
   - *Fix:* Add simple "Mark complete" UI on owner dashboard

3. **No worker visibility** - Owner posts job but can't see who applied until approval
   - *Issue:* Instant Book applications auto-approve but owner has no visibility
   - *Fix:* Show worker list with status (instant, pending, approved, completed)

4. **Auto-fill job count uncertainty**
   - *Issue:* Job auto-closes when `max_workers` reached, but owner may not realize
   - *Fix:* Show "Slots remaining: 2/3" on job card, notify owner when job fills

---

## DEFERRED TO POST-MVP

### Phase 2 (Geolocation + Contracts)
- QR code generation (currently mock token)
- Geolocation check-in validation (100m radius)
- Late arrival detection
- E-signature contracts
- Checkins table recording

### Phase 3 (Payments)
- Wallet transactions
- Payment processing
- Payout requests
- Commission calculation

### Phase 3+ (Advanced)
- Worker search/filtering (owner side)
- Job notifications (push)
- Worker blocking/reporting
- Reliability score history detail view

---

## INSTANT BOOK QUALIFICATION LOGIC (CORRECT)

**All 5 must be true:**
```
✓ Has language skill (verified)
✓ Level meets/exceeds requirement
✓ Reliability score >= job minimum (default 90)
✓ Account NOT frozen
✓ Identity verified (intro video exists)
```

**Current:** Correct in code (`lib/job-matching.ts`). Fix needed in UX (show why worker fails).

---

## MVP SCOPE CLARIFICATION

### What IS in MVP (Jan-Feb)
- Auth (phone OTP)
- Job posting
- Job feed with filters
- Instant Book auto-approval
- Request-to-Book manual approval
- Application tracking
- Reliability scoring (basic: +1 complete, -20 no-show, -2 late)
- Worker onboarding (language upload + identity video)

### What IS NOT in MVP
- ~~QR code scanning~~ (token generation only)
- ~~Geolocation validation~~ (Phase 2)
- ~~Contract signing~~ (Phase 2)
- ~~Payments~~ (Phase 2+)
- ~~Push notifications~~ (Phase 3)
- ~~Worker/owner messaging~~ (Phase 3)
- ~~Advanced search~~ (Phase 2)

---

## SIMPLEST PATH TO MVP COMPLETION

### Owner Journey Simplified
```
DAY 1: Register → Verify restaurant → Done
DAY 2: Post job (7 fields: title, lang, level, date, time, rate, slots) → Done
DAY 3: Applications come in:
  - Instant Book: Worker auto-approved, owner sees in dashboard
  - Request: Owner clicks "Approve" on dashboard
DAY 4: Job time arrives. Owner checks dashboard: "Mark complete"
       System updates worker reliability +1
```

### Worker Journey Simplified
```
DAY 1: Register → Upload language cert → Record intro video → Done
DAY 2: Browse feed (search/filter works instantly)
DAY 3: Find job → Click "Instant Book"
  - Gets confirmation: "You're booked! Check-in at 10am"
  - OR: "Pending owner approval" if Request-to-Book
DAY 4: Job day. No QR yet, but could show:
  - "Check-in here at 10am" (location + time)
  - "Job complete" button after shift ends
```

---

## NOTIFICATION REQUIREMENTS (MINIMAL)

### Critical for MVP
1. **Worker → Instant Book confirmation** - "You're booked for [job]"
2. **Worker → Request pending** - "Owner reviewing your application"
3. **Owner → New Request received** - "[Worker] applied for [job]"
4. **Owner → Job filled** - "Your job reached max workers"
5. **Worker → Job completed** - "Completed! +1 reliability point"

### NOT MVP
- Push notifications (in-app toasts only)
- Email reminders
- SMS alerts

---

## CRITICAL MISSING PIECES (MVP Blockers)

| Feature | Status | Impact | Fix |
|---------|--------|--------|-----|
| `/worker/dashboard` | ❌ Missing | Worker can't see applications | Build page: active jobs, status, upcoming shifts |
| `/owner/jobs/[id]/applications` | ❌ Missing | Owner can't approve pending | Build: list, approve/reject buttons, worker preview |
| Job completion endpoint | ❌ Missing | No way to mark job done | Add: `/api/jobs/[id]/complete` endpoint + UI button |
| Qualification feedback UI | ⚠️ Partial | Worker confused why no Instant Book | Display reasons in JobCard before apply |
| Worker list on job | ⚠️ Partial | Owner doesn't see who applied | Show approved workers on job dashboard |

---

## UNRESOLVED QUESTIONS

1. **Check-in without QR:** How should worker show up on job day? Geolocation? Time-based? For MVP, skip—assume owner manually verifies.

2. **Late arrival penalty:** Current scoring: -2 for late. When do we check? Check-in time doesn't exist in MVP. Defer to Phase 2.

3. **Reliability freeze logic:** Code says auto-freeze 7 days on no-show. But MVP has no attendance tracking. How does no-show trigger? Manually by owner? Defer the freeze, just track score.

4. **Auto-close job:** When `current_workers >= max_workers`, job auto-closes. Good. But owner may not notice. Add notification or confirmation dialog before submit if filling up.

5. **Request-to-Book message:** Should worker add message when requesting? Currently no UI for this. Nice-to-have, not MVP.

6. **Multi-language support:** MVP should prioritize Vietnamese (all copy in code is Vietnamese, good). English fallback works but isn't critical.

---

## RECOMMENDED MVP COMPLETION CHECKLIST

- [ ] Worker dashboard: List applications + status
- [ ] Owner applications view: Approve/reject pending
- [ ] Job completion: Owner marks job done
- [ ] Qualification feedback: Show "why Instant Book fails" in JobCard
- [ ] Worker list: Owner sees all applicants on job
- [ ] Test Instant Book flow end-to-end
- [ ] Test Request-to-Book approval flow end-to-end
- [ ] Reliability score updates correctly
- [ ] Account freeze logic works (if worker no-shows)
- [ ] Job auto-closes when filled
