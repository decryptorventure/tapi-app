# Implementation Plan Summary

**Plan:** End-to-End User Flows (Worker + Owner)
**Created:** 2026-01-07
**Timeline:** 20-25 days
**Status:** ✅ Ready for Implementation

---

## Quick Overview

Complete implementation of user journeys from registration to job completion for both Workers and Owners on Tapy platform.

**Key Features:**
- Gradual verification (browse first, block when needed)
- Instant Book (auto-approve qualified workers)
- QR-based check-in system
- Reliability scoring automation
- Manual payment MVP (no wallet)

---

## Files Created

### Main Plan
- **`plan.md`** - Master plan with architecture, phases, timeline

### Phase Details
- **`phase-01-foundation.md`** - Database migrations, core services, shared components (3-4 days)
- **`phase-02-worker-journey.md`** - Worker signup → profile → application → QR code (5-6 days)
- **`phase-03-owner-journey.md`** - Owner signup → restaurant → job posting → review (5-6 days) *[To be created]*
- **`phase-04-job-execution.md`** - QR scanning, check-in, completion, no-show handling (4-5 days) *[To be created]*
- **`phase-05-polish-testing.md`** - E2E tests, edge cases, performance (3-4 days) *[To be created]*

---

## Phase 1: Foundation (3-4 days) ✅

### Database
- New tables: `identity_verifications`, `business_verifications`
- Profile completion tracking fields
- RLS policies for security
- Automated calculation function

### Services
- `QRCodeService` - Generate + validate QR codes with HMAC signatures
- `VerificationService` - Upload documents to Supabase Storage

### Components
- `ImageUpload` - Drag & drop with preview
- `RolePicker` - Worker vs Owner selection cards

---

## Phase 2: Worker Journey (5-6 days) ✅

### Pages Implemented
1. `/signup` - Registration form
2. `/onboarding/role` - Role selection
3. `/onboarding/worker/profile` - Basic worker info
4. `/worker/profile/languages` - Add language skills + certificates
5. `/worker/profile/identity` - Upload ID documents
6. `/worker/jobs` - My applications (upcoming/pending/completed)
7. `/worker/jobs/[id]/qr` - QR code display

### Key Features
- Soft block banner (browse jobs, blocked from applying until 80% profile complete)
- Language certificate upload
- Identity verification with front/back images
- Application management UI

---

## Phase 3: Owner Journey (5-6 days) *[Next]*

### Pages to Implement
1. `/onboarding/owner/profile` - Restaurant info + business license
2. `/owner/dashboard` - Metrics, recent applications
3. `/owner/jobs/new` - Create job posting
4. `/owner/jobs/[id]/applications` - Review applications
5. `/owner/workers/[id]` - Worker profile view
6. `/owner/scan-qr` - Camera-based QR scanner

### Key Features
- Business verification upload
- Job posting form with requirements
- Application review (approve/reject)
- Worker profiles with ratings + history

---

## Phase 4: Job Execution (4-5 days) *[Next]*

### Workflows
1. **QR Generation** - On application approval
2. **QR Scanning** - Owner scans worker QR
3. **Check-in Validation** - Verify signature, expiry, status
4. **Job Completion** - Owner marks complete
5. **No-Show Detection** - Automated after 2 hours

### Services
- `CheckinService` - Handle check-in/out logic
- `ReliabilityService` - Score calculations
- `JobCompletionService` - Finalize jobs

---

## Phase 5: Polish & Testing (3-4 days) *[Next]*

### Testing
- **E2E Tests** - Full worker + owner flows
- **Unit Tests** - Services, functions, calculations
- **Integration Tests** - Database triggers, RLS

### Polish
- Error state improvements
- Loading skeletons
- Mobile responsive fixes
- Vietnamese error messages
- Performance optimization

---

## Technology Stack

### New Dependencies
```json
{
  "qrcode": "^1.5.3",
  "html5-qrcode": "^2.3.8",
  "react-dropzone": "^14.2.3",
  "crypto-js": "^4.2.0"
}
```

### Environment Variables
```env
QR_SECRET=<generated-secret>
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=verifications
```

---

## Key Technical Decisions

### 1. Gradual Verification
**Why:** Reduce friction, improve conversion
**How:** Allow browsing with <80% profile, block actions

### 2. QR Code Security
**Why:** Prevent forgery/tampering
**How:** HMAC-SHA256 signature + expiry + one-time use

### 3. Manual Payment MVP
**Why:** Faster launch, less complexity
**How:** Cash on-site, no wallet integration needed

### 4. Soft Blocking
**Why:** Better UX than hard blocks
**How:** Informative banners, progressive disclosure

---

## Database Schema Changes

### New Tables (2)
- `identity_verifications` - ID card/passport uploads
- `business_verifications` - Restaurant license uploads

### Extended Tables (1)
- `profiles` - Added completion %, can_apply, can_post_jobs

### New Functions (3)
- `calculate_profile_completion()` - Compute % based on role
- `update_profile_completion()` - Trigger on profile changes
- `update_profile_on_language_change()` - Trigger on language_skills

---

## Success Metrics

### Technical
- ✅ 0 TypeScript errors
- ✅ Build succeeds
- ✅ All E2E tests passing
- ✅ QR codes secure (tamper test)

### UX
- ✅ Onboarding < 5 minutes
- ✅ Profile completion clear
- ✅ QR scanner works on mobile
- ✅ Error messages helpful

### Performance
- ✅ Page load < 2s
- ✅ No layout shift
- ✅ QR validation < 500ms

---

## Risk Mitigation

### High Risk Items
1. **QR Security** → HMAC signatures + expiry
2. **No-show Detection** → Grace period + manual override
3. **Document Verification** → Auto-approve + spot checks

### Medium Risk Items
1. **Profile Abandonment** → Clear progress indicators
2. **Camera Permissions** → Fallback to manual entry
3. **Large File Uploads** → Client-side compression

---

## Next Steps

1. ✅ **Review Plan** - Ensure alignment with brainstorm
2. **Start Phase 1** - Database migrations first
3. **Create Phase 3-5 Details** - If approved
4. **Daily Progress Updates** - Track blockers
5. **Demo After Each Phase** - Validate before next phase

---

## Quick Start Guide

### For Immediate Implementation

1. **Install dependencies:**
   ```bash
   npm install qrcode html5-qrcode react-dropzone crypto-js
   npm install -D @types/qrcode @types/crypto-js
   ```

2. **Run Phase 1 migrations:**
   ```bash
   supabase db push
   ```

3. **Set environment variables** in `.env.local`

4. **Create foundation components** from `phase-01-foundation.md`

5. **Build worker pages** from `phase-02-worker-journey.md`

---

## Documentation

**Full Plan:** [plan.md](./plan.md)
**Phase 1:** [phase-01-foundation.md](./phase-01-foundation.md)
**Phase 2:** [phase-02-worker-journey.md](./phase-02-worker-journey.md)

**Source Brainstorm:** [brainstorm-260107-2129-user-flows-end-to-end.md](../reports/brainstorm-260107-2129-user-flows-end-to-end.md)

---

**Status:** ✅ Ready for Development
**Estimated Effort:** 20-25 days (1 FTE)
**Confidence:** High (comprehensive brainstorm + existing foundation)
