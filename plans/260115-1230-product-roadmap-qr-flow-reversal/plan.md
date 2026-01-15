---
title: "QR Flow Reversal & Product Roadmap"
description: "Reverse QR check-in flow (Owner generates → Worker scans) + strategic roadmap for Tapy platform"
status: pending
priority: P1
effort: 4d
branch: main
tags: [qr-code, check-in, flow-reversal, roadmap, critical]
created: 2026-01-15
---

# QR Flow Reversal & Product Roadmap

## Overview

| Phase | Title | Effort | Status | Link |
|-------|-------|--------|--------|------|
| 1 | QR Flow Reversal | 1d | pending | [phase-1-qr-flow-reversal.md](./phase-1-qr-flow-reversal.md) |
| 2 | Enhanced Check-in System | 2-3d | pending | [phase-2-enhanced-checkin.md](./phase-2-enhanced-checkin.md) |
| 3 | Future Roadmap | TBD | pending | [phase-3-future-roadmap.md](./phase-3-future-roadmap.md) |

## Problem Statement

**Current Flow (WRONG):**
Worker generates QR → Owner scans → Check-in recorded

**Required Flow (CORRECT):**
Owner has static QR per job → Worker scans → Validates approval → Check-in recorded

## Key Technical Assets

- Migration `20260115_qr_checkin_refactor.sql` already created `job_qr_codes` table
- `QRCodeService` already has new flow methods (`generateJobQR`, `validateJobQR`)
- Auto-generate trigger exists on jobs table
- GPS validation logic already implemented

## Dependencies

- `html5-qrcode` library for scanning (already installed)
- Supabase RLS policies for `job_qr_codes` (already created)
- `QR_SECRET` environment variable (required)

## Success Criteria

1. Owner can display QR code for any active job
2. Worker can scan QR and check-in if approved for that job
3. Duplicate check-ins prevented
4. Late arrivals detected and recorded
5. GPS validation optional but working

## Related Files

- `/lib/services/qr-code.service.ts` - QR generation/validation
- `/lib/services/checkin.service.ts` - Check-in processing
- `/app/owner/scan-qr/page.tsx` - Owner scanner (to become display)
- `/app/worker/jobs/[id]/qr/page.tsx` - Worker QR (to become scanner)
- `/supabase/migrations/20260115_qr_checkin_refactor.sql` - Database schema

## Unresolved Questions

1. QR expiration policy: per-shift or job lifetime?
2. Offline check-in support scope?
3. GPS radius for validation (100m vs 200m)?
4. Static vs dynamic QR regeneration strategy?
