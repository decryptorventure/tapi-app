# Implementation Plan: End-to-End User Flows

**Plan ID:** 260107-2129-end-to-end-flows
**Created:** 2026-01-07
**Status:** Active
**Approach:** Phased implementation, gradual verification, Instant Book logic

---

## Executive Summary

Implement complete user journeys for Worker and Owner from registration → job completion. Based on comprehensive brainstorming session covering:
- Registration & onboarding with role selection
- Profile completion with gradual verification
- Document verification (Language + Identity + Business)
- Job posting & discovery (already partially built)
- Application workflow with Instant Book
- QR-based check-in/checkout system
- Job completion & reliability scoring

---

## Design Principles

✅ **YAGNI** - Manual payment MVP, no wallet system
✅ **KISS** - Single signup flow, role picker, shared components
✅ **DRY** - Reusable verification upload, shared auth logic
✅ **Layered Architecture** - Components → Hooks → Services → Database

---

## Current State Analysis

### ✅ Already Implemented
- Database schema (7 tables with RLS)
- Supabase auth integration
- Job discovery feed with enhanced UI
- Job qualification algorithm (5 criteria)
- JobCard component with Instant Book indicators
- Application create/query hooks

### ❌ Missing (This Plan)
- Registration/onboarding screens
- Profile completion flows
- Document upload + verification
- Owner/Worker dashboards
- QR code generation + scanning
- Check-in/completion workflows
- Reliability score updates

---

## Implementation Phases

### Phase 1: Foundation (Database + Auth)
**Timeline:** 3-4 days
**Files:** `phase-01-foundation.md`

- Database migrations (identity_verifications, business_verifications, profile completion tracking)
- Auth enhancement (role selection, onboarding flow)
- Shared components (ImageUpload, RolePicker, ProfileCompletionBanner)
- Core services (QRCodeService, verification helpers)

### Phase 2: Worker Journey
**Timeline:** 5-6 days
**Files:** `phase-02-worker-journey.md`

- Registration + onboarding screens
- Worker profile completion
- Language skills management
- Identity verification upload
- Application management UI
- QR code display

### Phase 3: Owner Journey
**Timeline:** 5-6 days
**Files:** `phase-03-owner-journey.md`

- Owner registration + onboarding
- Restaurant profile setup
- Business verification upload
- Owner dashboard
- Job posting form
- Application review UI

### Phase 4: Job Execution
**Timeline:** 4-5 days
**Files:** `phase-04-job-execution.md`

- QR code scanner (owner side)
- Check-in flow + validation
- Job completion workflow
- No-show handling automation
- Reliability score updates
- Payment confirmation UI

### Phase 5: Polish & Testing
**Timeline:** 3-4 days
**Files:** `phase-05-polish-testing.md`

- E2E testing (worker + owner flows)
- Edge case handling
- Error states + messaging
- Performance optimization
- Security audit
- Documentation

**Total Estimated Timeline:** 20-25 days

---

## Technical Architecture

### New Database Tables

```sql
-- identity_verifications
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  id_number TEXT,
  issue_date DATE,
  status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- business_verifications
CREATE TABLE business_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  license_url TEXT NOT NULL,
  license_number TEXT NOT NULL,
  status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile completion tracking
ALTER TABLE profiles ADD COLUMN profile_completion_percentage INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN can_apply BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN can_post_jobs BOOLEAN DEFAULT FALSE;
```

### New Services Layer

```
lib/services/
├── worker-onboarding.service.ts       # Worker profile completion
├── owner-onboarding.service.ts        # Owner profile completion
├── verification.service.ts            # Document upload + validation
├── qr-code.service.ts                 # QR generation + validation
├── checkin.service.ts                 # Check-in/out logic
├── reliability.service.ts             # Score calculations
└── job-completion.service.ts          # Job finalization
```

### New Pages Structure

```
app/
├── (auth)/
│   ├── signup/
│   │   └── page.tsx                   # Registration form
│   ├── login/
│   │   └── page.tsx                   # Login form
│   └── onboarding/
│       ├── role/
│       │   └── page.tsx               # Role selection
│       ├── worker/
│       │   └── profile/
│       │       └── page.tsx           # Worker onboarding
│       └── owner/
│           └── profile/
│               └── page.tsx           # Owner onboarding
├── worker/
│   ├── dashboard/
│   │   └── page.tsx                   # Worker home
│   ├── jobs/
│   │   ├── page.tsx                   # My jobs list
│   │   └── [id]/
│   │       ├── page.tsx               # Job detail
│   │       └── qr/
│   │           └── page.tsx           # QR code display
│   └── profile/
│       ├── languages/
│       │   └── page.tsx               # Language skills
│       └── identity/
│           └── page.tsx               # Identity verification
├── owner/
│   ├── dashboard/
│   │   └── page.tsx                   # Owner home
│   ├── jobs/
│   │   ├── page.tsx                   # My job listings
│   │   ├── new/
│   │   │   └── page.tsx               # Create job
│   │   └── [id]/
│   │       ├── edit/
│   │       │   └── page.tsx           # Edit job
│   │       ├── applications/
│   │       │   └── page.tsx           # View applications
│   │       └── rate/
│   │           └── page.tsx           # Rate workers
│   ├── workers/
│   │   └── [id]/
│   │       └── page.tsx               # Worker profile view
│   └── scan-qr/
│       └── page.tsx                   # QR scanner
└── profile/
    └── page.tsx                       # Edit profile (shared)
```

### New Components

```
components/
├── auth/
│   ├── signup-form.tsx                # Registration
│   ├── login-form.tsx                 # Login
│   └── role-picker.tsx                # Role selection cards
├── onboarding/
│   ├── worker-profile-form.tsx
│   ├── owner-profile-form.tsx
│   └── profile-completion-banner.tsx  # Soft block banner
├── verification/
│   ├── image-upload.tsx               # Document upload
│   ├── language-skill-form.tsx
│   ├── identity-verification-form.tsx
│   └── business-verification-form.tsx
├── worker/
│   ├── application-card.tsx           # Application list item
│   ├── job-detail-modal.tsx
│   └── qr-code-display.tsx           # Show QR
├── owner/
│   ├── job-form.tsx                   # Create/edit job
│   ├── application-list.tsx
│   ├── worker-profile-card.tsx
│   ├── qr-scanner.tsx                 # Camera scanner
│   └── checkin-list.tsx               # Recent check-ins
└── shared/
    ├── dashboard-layout.tsx           # Common dashboard shell
    ├── stat-card.tsx                  # Metrics display
    └── empty-state.tsx                # No data state
```

---

## Key Features Implementation

### 1. Gradual Verification

**Approach:** Soft blocking with progressive disclosure

```typescript
// Profile completion calculation
function calculateCompletion(profile: Profile): number {
  let score = 0;

  // Basic info (20%)
  if (profile.full_name && profile.phone_number) score += 20;

  // Role selected (10%)
  if (profile.role) score += 10;

  // Role-specific (70%)
  if (profile.role === 'worker') {
    if (profile.date_of_birth) score += 10;
    if (hasVerifiedLanguage(profile.id)) score += 30;
    if (profile.is_verified) score += 30;
  } else if (profile.role === 'owner') {
    if (profile.restaurant_name && profile.restaurant_address) score += 30;
    if (isBusinessVerified(profile.id)) score += 40;
  }

  return score;
}

// Soft block logic
function canApplyToJobs(profile: Profile): boolean {
  return calculateCompletion(profile) >= 80;
}
```

### 2. Instant Book Logic

**Already implemented in `lib/job-matching.ts`**, enhance with verification checks:

```typescript
// 5 criteria for Instant Book:
1. Language skill verified ✓
2. Language level meets/exceeds requirement ✓
3. Reliability score ≥ minimum ✓
4. Account not frozen ✓
5. Identity verified ✓  // ADD THIS

// Auto-approve if ALL met
if (allCriteriaMet) {
  application.status = 'approved';
  application.is_instant_book = true;
  generateQRCode(application.id);
}
```

### 3. QR Code System

**Security considerations:**

```typescript
// QR data structure
interface QRCodeData {
  application_id: string;
  worker_id: string;
  job_id: string;
  expires_at: string;  // 1 hour after shift_start_time
  signature: string;    // HMAC-SHA256(data + secret)
}

// Generation
function generateQRCode(applicationId: string): string {
  const data = { application_id, worker_id, job_id, expires_at };
  const signature = hmacSHA256(JSON.stringify(data), process.env.QR_SECRET);
  return base64Encode({ ...data, signature });
}

// Validation
function validateQRCode(qrData: string): boolean {
  const decoded = base64Decode(qrData);
  const { signature, ...data } = decoded;

  // Verify signature
  const expectedSig = hmacSHA256(JSON.stringify(data), process.env.QR_SECRET);
  if (signature !== expectedSig) return false;

  // Check expiry
  if (new Date(data.expires_at) < new Date()) return false;

  // Check application status
  const app = getApplication(data.application_id);
  return app.status === 'approved';
}
```

### 4. Reliability Scoring

**Automated triggers:**

```typescript
// On-time check-in
trigger: checkin created within 1 hour of shift_start_time
action: +1 point

// Late check-in
trigger: checkin created 1-2 hours after shift_start_time
action: -2 points

// Job completion
trigger: application.status = 'completed'
action: +1 point

// No-show
trigger: 2 hours after shift_start_time, no checkin record
action: -20 points + freeze account 7 days

// Database function
CREATE OR REPLACE FUNCTION update_reliability_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate change based on event type
  -- Update profiles.reliability_score
  -- Insert into reliability_history
  -- Check if account should be frozen
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Testing Strategy

### Unit Tests
- Service layer functions
- QR code generation + validation
- Reliability score calculations
- Profile completion logic

### Integration Tests
- API endpoints (if created)
- Database triggers
- Supabase RLS policies

### E2E Tests (Priority)
```typescript
describe('Worker Flow', () => {
  test('Full journey: signup → apply → check-in → complete', async () => {
    // 1. Register as worker
    // 2. Complete profile
    // 3. Upload language certificate
    // 4. Upload ID
    // 5. Browse jobs
    // 6. Apply to qualified job (Instant Book)
    // 7. View QR code
    // 8. (Owner) Scan QR
    // 9. (Owner) Mark complete
    // 10. Verify reliability score increased
  });
});

describe('Owner Flow', () => {
  test('Full journey: signup → post job → review → scan QR → complete', async () => {
    // 1. Register as owner
    // 2. Complete restaurant profile
    // 3. Upload business license
    // 4. Create job posting
    // 5. Review applications
    // 6. Approve application
    // 7. Scan worker QR
    // 8. Mark job complete
    // 9. Rate worker
  });
});
```

### Manual Testing Checklist
- [ ] Signup flow (worker + owner)
- [ ] Profile completion progress bar
- [ ] Soft block banners
- [ ] Document upload + preview
- [ ] Job posting form validation
- [ ] Instant Book vs Request to Book
- [ ] QR code generation
- [ ] QR scanner (camera permissions)
- [ ] Late check-in warning
- [ ] No-show automation
- [ ] Reliability score updates
- [ ] Account freeze logic
- [ ] Mobile responsiveness
- [ ] Dark mode (future)

---

## Success Criteria

### Technical
- ✅ All E2E tests passing
- ✅ No TypeScript errors
- ✅ Build succeeds without warnings
- ✅ No console errors in production
- ✅ RLS policies tested and secure
- ✅ QR codes cannot be forged
- ✅ Profile completion accurate

### UX
- ✅ Onboarding completes in < 5 minutes
- ✅ Profile completion progress clear
- ✅ Soft blocks informative, not frustrating
- ✅ QR code generation instant
- ✅ QR scanner works on mobile
- ✅ Error messages helpful (Vietnamese)

### Performance
- ✅ Page load < 2s
- ✅ Job feed loads with skeleton loaders
- ✅ No layout shift during data fetch
- ✅ QR validation < 500ms

---

## Risk Assessment

### High Risk
❌ **QR code security** - Could be forged if not properly signed
→ Mitigation: HMAC signature, expiry, one-time use

❌ **No-show detection timing** - False positives if shift changed
→ Mitigation: Allow owner to manually mark arrived, grace period

❌ **Document verification** - Manual review bottleneck
→ Mitigation: Start with auto-approve + spot checks, add AI OCR later

### Medium Risk
⚠️ **Profile completion blocking** - Users might abandon
→ Mitigation: Clear progress indicators, allow browsing

⚠️ **Camera permissions** - QR scanner may not work
→ Mitigation: Fallback to manual code entry

⚠️ **Mobile upload** - Large photo files
→ Mitigation: Client-side compression before upload

### Low Risk
✓ **Reliability score gaming** - Workers cancelling to avoid no-show
→ Mitigation: Cancellation penalties, track cancellation rate

✓ **Data migration** - Existing profiles need new fields
→ Mitigation: Migrations handle NULL values, gradual rollout

---

## Dependencies

### External Services
- Supabase Storage (document uploads)
- Supabase Auth (already integrated)
- Supabase Realtime (optional, for live updates)

### New Libraries
```json
{
  "qrcode": "^1.5.3",              // QR generation
  "html5-qrcode": "^2.3.8",        // QR scanning
  "react-dropzone": "^14.2.3",     // File upload
  "date-fns": "^3.0.6",            // Already installed
  "crypto-js": "^4.2.0"            // HMAC signatures
}
```

### Environment Variables
```env
# Add to .env.local
QR_SECRET=<generate-strong-secret>  # For QR code signing
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10   # File upload limit
```

---

## Rollout Strategy

### Phase 1 Deployment (MVP)
1. Deploy database migrations
2. Deploy new pages + components
3. Test worker flow end-to-end
4. Test owner flow end-to-end
5. Monitor error rates

### Phase 2 Deployment (Verification)
1. Enable document upload
2. Manual admin verification
3. Monitor verification turnaround time

### Phase 3 Deployment (QR System)
1. Enable QR generation
2. Test QR scanner extensively
3. Monitor check-in success rate

### Rollback Plan
- Database migrations reversible
- Feature flags for new flows
- Keep old job feed functional
- Gradual user migration

---

## Post-MVP Enhancements

### Short-term (1-2 months)
- Push notifications (job matches, approvals)
- Rating system (worker ↔ owner)
- Advanced job filters
- Worker profiles (public view)

### Mid-term (3-6 months)
- Payment integration (wallet system)
- E-contract signing
- Admin verification panel
- Analytics dashboard

### Long-term (6+ months)
- AI-powered job matching
- Video verification
- Mobile apps (React Native)
- Multi-language support

---

## Next Steps

1. **Review this plan** - Ensure alignment with requirements
2. **Approve phases** - Confirm phase breakdown + timeline
3. **Start Phase 1** - Database migrations + foundation
4. **Daily standups** - Track progress, blockers
5. **Demo after each phase** - Validate before proceeding

---

## Phase Details

Detailed implementation steps in separate files:
- [Phase 1: Foundation](./phase-01-foundation.md)
- [Phase 2: Worker Journey](./phase-02-worker-journey.md)
- [Phase 3: Owner Journey](./phase-03-owner-journey.md)
- [Phase 4: Job Execution](./phase-04-job-execution.md)
- [Phase 5: Polish & Testing](./phase-05-polish-testing.md)

---

**Plan Status:** ✅ Ready for Review
**Estimated Total Effort:** 20-25 days (1 developer, full-time)
**Confidence Level:** High (based on comprehensive brainstorming + existing foundation)
