---
title: "Tapy Go-Live: Owner-Worker Flow"
description: "3-phase launch plan for Just-in-Time recruitment marketplace MVP"
status: pending
priority: P1
effort: 8h
branch: main
tags: [go-live, mvp, owner, worker, marketplace]
created: 2026-01-13
---

# Tapy Go-Live Implementation Plan

## Overview

Launch Tapy MVP ensuring smooth Owner-Worker operational flow. Focus: validate Instant Book algorithm, QR check-in reliability, notification delivery before scaling.

## Phase Structure

| Phase | Focus | Duration | Effort |
|-------|-------|----------|--------|
| [Phase 1](./phase-01-pre-launch-validation.md) | Pre-Launch Validation | 3-4 days | 3h |
| [Phase 2](./phase-02-soft-launch.md) | Soft Launch (Closed Beta) | 1-2 weeks | 3h |
| [Phase 3](./phase-03-production-launch.md) | Production Launch | Day 21+ | 2h |

## Current Implementation Status

**Completed:**
- Supabase auth, 7-table DB schema with RLS
- Job matching algorithm (5-criteria), language level comparison
- Job Feed with filters/search, Instant Book + Request-to-Book
- Owner Dashboard (stats, job/application management, QR scanning)
- Multi-image upload, multi-language support (VI/EN/JA/KO)

**Not Implemented (defer to Phase 2+):**
- Push notifications (FCM)
- E-contract signing
- Wallet & payment integration
- Identity verification (e-KYC)

## Critical Success Factors

1. **Instant Book accuracy** - >70% success rate, zero false positives
2. **QR check-in reliability** - >90% first-attempt success
3. **No-show rate** - <5% during soft launch
4. **Notification delivery** - 100% in-app, SMS fallback ready

## Key Files

| Component | Path |
|-----------|------|
| Job Matching | `/lib/job-matching.ts` |
| Check-in Service | `/lib/services/checkin.service.ts` |
| QR Code Service | `/lib/services/qr-code.service.ts` |
| Job Application | `/lib/services/job-application.service.ts` |
| DB Schema | `/supabase/schema.sql` |

## Launch Timeline

```
Week 0: Pre-Launch Validation (Phase 1)
 - Test critical flows, fix gaps
 - Edge case testing: 50+ scenarios

Week 1-2: Closed Beta (Phase 2)
 - 10-15 restaurants + 50-100 workers
 - Daily metric reviews, bug fixes

Week 3+: Production Launch (Phase 3)
 - Full marketplace, 24/7 monitoring
 - Scale to 50+ restaurants
```

## Risk Summary

| Risk | Mitigation |
|------|-----------|
| Instant-book books unqualified workers | Test 100+ edge cases before launch |
| QR check-in fails under poor network | Implement offline fallback, test 10 locations |
| No-shows spike | Validate notification delivery, freeze system |
| Reliability score inaccurate | Manual verification of 50 test shifts |

---

**Next Step:** Start Phase 1 Pre-Launch Validation
