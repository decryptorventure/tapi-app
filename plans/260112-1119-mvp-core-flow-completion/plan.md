---
title: "MVP Core Flow Completion"
description: "Complete the job-to-completion flow: QR security, qualification UX, job completion, design consistency"
status: pending
priority: P1
effort: 14h
branch: main
tags: [mvp, qr, ux, completion-flow]
created: 2026-01-12
---

# MVP Core Flow Completion

## Objective
Complete end-to-end hiring flow: Worker applies -> Owner approves -> Worker shows QR -> Owner scans -> Job completes.

## Current State (85% Complete)
- Auth, job posting, job feed, application workflow: DONE
- QR generation/scanning: DONE (4 security fixes needed)
- Owner applications page: DONE (approve/reject works)
- Worker "My Jobs": DONE (tabs for upcoming/pending/completed)
- Check-in service with reliability scoring: DONE
- Database schema: DONE

## Gaps to Close
1. QR security hardening (env var, one-time use, rate limit)
2. Worker qualification feedback in JobCard
3. Owner "Mark Complete" button on approved applications
4. Worker QR page design system alignment
5. E2E flow testing

## Phases

| Phase | Focus | Effort | Files |
|-------|-------|--------|-------|
| [01](./phase-01-qr-security-fixes.md) | QR Security | 4h | qr-code.service.ts, checkin.service.ts, scan-qr/page.tsx |
| [02](./phase-02-worker-qualification-ux.md) | Qualification UX | 2h | job-card.tsx, use-job-matching.ts |
| [03](./phase-03-job-completion-flow.md) | Job Completion | 3h | applications/page.tsx, checkin.service.ts |
| [04](./phase-04-ui-design-consistency.md) | Design System | 2h | worker/jobs/[id]/qr/page.tsx |
| [05](./phase-05-e2e-flow-testing.md) | E2E Testing | 3h | Manual + test scripts |

**Total: 14h**

## Success Criteria
- [ ] QR_SECRET set in production
- [ ] One-time use enforced (double-scan blocked)
- [ ] Worker sees WHY they don't qualify for Instant Book
- [ ] Owner can mark approved applications as "completed"
- [ ] Worker QR page follows design system
- [ ] Full flow tested: apply -> approve -> QR -> scan -> complete

## Out of Scope (Phase 2+)
- Geolocation validation
- E-contracts
- Payment/wallet
- Push notifications

## Unresolved Questions
1. **No-show trigger:** Manual owner action or cron job? (Recommend: owner clicks "No Show" button)
2. **Check-out flow:** Required or optional? (Current: optional, triggered by owner re-scan)
3. **QR expiry:** Shift start + 2h adequate? Or shift end?
