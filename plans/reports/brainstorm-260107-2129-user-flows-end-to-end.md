# End-to-End User Flows: Owner & Worker - Tapy Platform

**Date:** 2026-01-07
**Session:** Brainstorming
**Approach:** Gradual verification, Instant Book, QR check-in, Manual payment

---

## Executive Summary

Comprehensive flows for **Owner** (restaurant) and **Worker** (part-timer) from registration → job completion. Emphasizes:
- **Gradual verification** - Browse first, block when action needed
- **Instant Book** - Auto-approve qualified workers
- **QR check-in** - Worker scans, owner confirms completion
- **Triple verification** - Language + Identity + Business license

---

## Design Principles Applied

✅ **YAGNI** - No wallet/payment system (manual payment MVP)
✅ **KISS** - Single signup with role picker (not separate flows)
✅ **DRY** - Shared auth, verification upload components

---

## Current Implementation Status

### ✅ Already Built
- Database schema (7 tables: profiles, language_skills, jobs, job_applications, checkins, reliability_history, wallet_transactions)
- Basic auth system (Supabase)
- Job qualification algorithm (5-criteria Instant Book logic)
- Job discovery feed
- Job card component (enhanced UI/UX)
- Application workflow (pending → approved/rejected)

### ❌ Missing (Need to Build)
- **Registration/onboarding flows**
- **Profile completion screens**
- **Document upload + verification**
- **Owner dashboard** (post job, view applications)
- **Worker dashboard** (my jobs, applications)
- **QR code generation + scanning**
- **Job completion flow**
- **Rating system** (optional for MVP)

---

## 🏗️ System Architecture

### User Roles
```typescript
type UserRole = 'worker' | 'owner'
```

### Verification States
```typescript
type VerificationStatus = 'pending' | 'verified' | 'rejected'
```

### Profile Completion Stages
```
Stage 1: Basic Info (required to browse)
Stage 2: Role-specific Details (required to take action)
Stage 3: Document Verification (required for instant book/posting)
```

---

## 📱 WORKER FLOW - End to End

### 1️⃣ Registration & Onboarding

#### 1.1 Signup (`/signup`)
**Screen:**
```
[Logo]
Welcome to Tapy
Connect với công việc phù hợp

[Google Sign In]
[Email Sign In]

Đã có tài khoản? [Đăng nhập]
```

**Fields (Email signup):**
- Email
- Password
- Phone number
- Full name
- Agree to Terms & Privacy

**Action:**
- Create Supabase auth user
- Create profile record with `role: null` (not set yet)
- Navigate to `/onboarding/role`

---

#### 1.2 Role Selection (`/onboarding/role`)
**Screen:**
```
Bạn là ai?

[Card: Tôi đang tìm việc] (Worker)
  → Part-time, kiếm thêm thu nhập

[Card: Tôi đang tuyển người] (Owner)
  → Nhà hàng, cần tuyển nhân viên

[Skip for now] (allows browsing only)
```

**Action:**
- Update profile: `role = 'worker'`
- Navigate to `/onboarding/worker/profile`

---

#### 1.3 Worker Profile - Basic Info (`/onboarding/worker/profile`)
**Screen:**
```
Hoàn thiện hồ sơ

[Avatar Upload] (optional)
Full name: [prefilled]
Phone: [prefilled]
Date of birth: [DD/MM/YYYY]
University: [Dropdown: HCMC Uni of Tech, VNU-HCM, etc.]
Bio: [Textarea - optional]

[Intro video] (optional)
  Record 30s giới thiệu bản thân

[Continue] → Allows browsing
[Skip for now] → Allows browsing
```

**Validation:**
- Phone number (E.164 format)
- Date of birth (18+ years old)

**Action:**
- Update profile with worker fields
- Navigate to `/` (job feed) with **soft block banner**

---

#### 1.4 Soft Block Banner (on Job Feed)
```
⚠️ Hoàn thiện hồ sơ để ứng tuyển
[Add language skills] [Upload ID] → Profile completion %

Progress: 40% complete
```

**Browse Mode:**
- Can view all jobs
- Can see job requirements
- **Cannot apply** until profile 80%+ complete

---

### 2️⃣ Profile Completion (Triggered when trying to apply)

#### 2.1 Language Skills (`/profile/worker/languages`)
**Screen:**
```
Kỹ năng ngôn ngữ
Thêm chứng chỉ để tăng cơ hội việc làm

[+ Add Language]

For each language:
  Language: [Japanese / Korean / English]
  Level: [N5, N4, N3, N2, N1] or [TOPIK 1-6] or [A1-C2]
  Certificate: [Upload Image/PDF]

  Status: [Pending] [Verified ✓] [Rejected ✗]

[Continue]
```

**Validation:**
- At least 1 language required to apply
- Certificate upload → verification_status = 'pending'
- Admin reviews → update to 'verified' or 'rejected'

**Action:**
- Insert into `language_skills` table
- If certificate uploaded → notify admin for verification

---

#### 2.2 Identity Verification (`/profile/worker/identity`)
**Screen:**
```
Xác thực danh tính
Đảm bảo an toàn cho cả worker và owner

[Upload front of ID/Passport]
[Upload back of ID/Passport]

ID Number: [auto-extract via OCR - optional]
Issue date: [DD/MM/YYYY]

Status: Pending verification ⏳

[Submit]
```

**Validation:**
- Front + back images required
- Image quality check (min resolution)

**Action:**
- Save images to Supabase storage
- Update profile: `is_verified = false` (pending)
- Admin reviews → update `is_verified = true`

---

### 3️⃣ Job Discovery & Application

#### 3.1 Job Feed (`/`)
**Already built - enhanced UI**

**Features:**
- Sticky header with job count
- Job cards with hover effects
- Language badges
- Instant Book indicator
- Skeleton loaders

**Blocked Actions:**
- If profile < 80% complete → "Complete profile to apply"
- If language not verified → "Verify language skill to apply"
- If identity not verified → "Verify identity for instant book"

---

#### 3.2 Job Detail Modal (`/jobs/[id]`)
**Screen:**
```
[Restaurant Photo]

Waiter - Japanese Restaurant
₫120,000/hour

📅 20/01/2026 • 18:00 - 23:00
📍 Restaurant Address
🗣️ Japanese N3 required

Description:
[Full job description...]

Requirements:
✓ Language: Japanese N3
✓ Reliability: ≥ 90 points
✓ Identity verified
✓ Account not frozen

Dress code: Black shirt, black pants

Your status:
[✅ You meet all requirements - Instant Book available]
OR
[❌ Missing: Japanese N3 certificate]

[🌟 Instant Book] (green gradient)
OR
[📝 Request to Book] (blue)

[Close]
```

**Action:**
- Check worker qualifications via `useJobQualification` hook
- Show appropriate button (Instant Book vs Request)

---

#### 3.3 Apply to Job
**Process:**
1. Worker clicks apply button
2. System checks 5 criteria:
   - Language skill verified ✓
   - Language level meets/exceeds requirement ✓
   - Reliability score ≥ minimum ✓
   - Account not frozen ✓
   - Identity verified ✓
3. **If ALL met:**
   - Create application with `is_instant_book = true`
   - Auto-approve: `status = 'approved'`
   - Generate QR code for check-in
   - Send notification to owner + worker
4. **If ANY failed:**
   - Create application with `is_instant_book = false`
   - Set `status = 'pending'`
   - Notify owner to review
   - Wait for owner approval

**Toast Messages:**
```
✅ "Đặt chỗ thành công! QR code đã được gửi."
OR
⏳ "Đã gửi yêu cầu. Owner sẽ xem xét trong 24h."
```

---

### 4️⃣ Application Management

#### 4.1 My Jobs (`/worker/jobs`)
**Screen:**
```
My Jobs

[Tabs: Upcoming | Pending | Completed | Cancelled]

**Upcoming:**
For each approved job:
  [Job Card]
  Restaurant Name
  Date/Time
  ₫120,000/hour
  Status: Confirmed ✓

  [View QR Code] [View Details] [Cancel]

**Pending:**
  Status: Waiting for approval ⏳
  Applied: 2 hours ago

  [Withdraw Application]

**Completed:**
  Completed: 15/01/2026
  Earned: ₫600,000
  Rating: [⭐⭐⭐⭐⭐]

  [Rate Owner]
```

---

#### 4.2 View QR Code (`/worker/jobs/[id]/qr`)
**Screen:**
```
Check-in QR Code

[Large QR Code]

Restaurant: Tanaka Izakaya
Date: 20/01/2026
Time: 18:00 - 23:00

Instructions:
1. Arrive 10 minutes early
2. Show this QR to manager
3. Manager will scan to confirm arrival
4. Complete your shift
5. Manager confirms completion

⏰ Valid until: 19:00 (1 hour after shift start)

[Download QR] [Share]
```

**QR Code Data:**
```json
{
  "application_id": "uuid",
  "worker_id": "uuid",
  "job_id": "uuid",
  "expires_at": "2026-01-20T19:00:00Z",
  "signature": "hmac_signature"
}
```

---

### 5️⃣ Check-in & Job Completion

#### 5.1 Worker Arrives - Scan QR
**Owner scans QR with `/owner/scan-qr` page**

**Process:**
1. Owner opens QR scanner
2. Scans worker's QR code
3. System validates:
   - QR not expired ✓
   - Application status = 'approved' ✓
   - Shift date matches today ✓
   - Current time within check-in window ✓
4. Create checkin record:
   ```sql
   INSERT INTO checkins (
     application_id,
     worker_id,
     checkin_time,
     checkin_lat,
     checkin_lng
   )
   ```
5. Show success message to owner + worker notification

**Toast:**
```
✅ "[Worker Name] checked in successfully!"
```

---

#### 5.2 After Shift - Owner Confirms Completion
**Owner Dashboard → Active Jobs → [Mark Complete]**

**Process:**
1. Owner clicks "Complete Job"
2. Confirmation dialog:
   ```
   Mark job as completed?

   Worker: [Name]
   Shift: 18:00 - 23:00
   Hours worked: 5 hours
   Total pay: ₫600,000

   [Cancel] [Confirm Complete]
   ```
3. Update application: `status = 'completed'`
4. Update checkin record: `checkout_time = now()`
5. **Update reliability score:**
   - On-time check-in → +1 point
   - Completed shift → +1 point
6. Send notification to worker

---

#### 5.3 No-Show Handling
**If worker doesn't check in by `shift_start_time + 2 hours`:**

**Automated Process:**
1. System marks application: `status = 'no_show'`
2. **Reliability penalty:**
   - Score: -20 points
   - Freeze account for 7 days: `is_account_frozen = true`, `frozen_until = now() + 7 days`
3. Insert into `reliability_history`:
   ```sql
   INSERT INTO reliability_history (
     user_id,
     change_amount: -20,
     reason: 'no_show',
     job_id
   )
   ```
4. Notify worker + owner
5. Re-open job slot

---

### 6️⃣ Payment (Manual - MVP)
**After job completed:**

**Worker notification:**
```
Job completed! ✓
Earn: ₫600,000

Payment: Receive cash from owner on-site
If issue, contact: support@tapy.vn
```

**Owner reminder:**
```
Please pay worker:
₫600,000 cash

Worker: [Name]
Job: [Title]
Date: 20/01/2026
```

**Future Phase:**
- Wallet system
- Bank transfer
- QR payment (VietQR)

---

## 🏢 OWNER FLOW - End to End

### 1️⃣ Registration & Onboarding

#### 1.1-1.2 Signup + Role Selection
**Same as Worker:** `/signup` → `/onboarding/role`

Select: **[Tôi đang tuyển người]** → `role = 'owner'`

---

#### 1.3 Owner Profile (`/onboarding/owner/profile`)
**Screen:**
```
Thông tin nhà hàng

[Restaurant Logo/Photo]
Restaurant Name: [Text]
Address: [Text]
[📍 Pin on map]

Cuisine Type: [Japanese / Korean / Asian Fusion / etc.]
Business License Number: [Text]

[Upload Business License]
  Status: Pending verification ⏳

[Continue]
```

**Validation:**
- Restaurant name required
- Address + GPS coordinates required
- Business license image required

**Action:**
- Update profile with owner fields
- Save license to storage
- Admin reviews business license
- Navigate to `/owner/dashboard`

---

### 2️⃣ Owner Dashboard

#### 2.1 Dashboard Home (`/owner/dashboard`)
**Screen:**
```
[Sidebar Navigation]
  📊 Dashboard
  📝 Post Job
  👥 Active Jobs
  📋 Applications
  ⚙️ Settings

**Dashboard Metrics:**
  Active Jobs: 3
  Pending Applications: 7
  Workers This Month: 12
  Avg Rating: 4.8 ⭐

**Recent Applications:**
[List of pending applications with quick actions]

**Upcoming Shifts:**
[Calendar view of scheduled jobs]
```

---

### 3️⃣ Post New Job

#### 3.1 Create Job Listing (`/owner/jobs/new`)
**Screen:**
```
Post New Job

Basic Info:
  Job Title: [Waiter / Server / Dishwasher / etc.]
  Description: [Textarea]

Schedule:
  Date: [Calendar picker]
  Start Time: [Time picker]
  End Time: [Time picker]

Compensation:
  Hourly Rate: [₫ _____ ]

Requirements:
  Language: [Japanese / Korean / English]
  Level: [N5 ... N1 / TOPIK 1-6 / A1-C2]
  Min Reliability Score: [Slider: 0-100]

Additional:
  Dress Code: [Text - optional]
  Special Instructions: [Textarea - optional]
  Max Workers: [Number - default 1]

[Save as Draft] [Post Job]
```

**Validation:**
- Shift date must be future date
- Hourly rate ≥ minimum wage (₫25,000 in Vietnam)
- End time > start time

**Action:**
- Insert into `jobs` table
- Set `status = 'open'`
- Notify matched workers (future feature)
- Redirect to `/owner/jobs`

---

### 4️⃣ Application Management

#### 4.1 View Applications (`/owner/jobs/[id]/applications`)
**Screen:**
```
Waiter - 20/01/2026

[Tabs: Instant Book (Auto) | Pending Review | Approved | All]

**Instant Book (3):**
For each auto-approved:
  [Worker Card]
  Avatar
  [Name] • Verified ✓
  Japanese N2 • Reliability: 98
  University: VNU-HCM

  Status: Confirmed ✓
  Applied: 2 hours ago

  [View Profile] [Cancel Booking]

**Pending Review (4):**
For each pending:
  [Worker Card]
  Avatar
  [Name] • Verified ✓
  Japanese N4 • Reliability: 85

  ⚠️ Does not meet: Language level (N3 required)

  [View Profile] [Approve] [Reject]
```

---

#### 4.2 Worker Profile View (`/owner/workers/[id]`)
**Screen:**
```
[Avatar]
[Worker Name] • 22 years old
Student at VNU-HCM

Reliability: 95/100 ⭐
Jobs Completed: 23
Rating: 4.9 ⭐ (18 reviews)

Language Skills:
  ✅ Japanese N2 (Verified)
  ✅ English B2 (Verified)

Bio:
[Worker's bio text...]

[Intro Video]
[Play 30s intro video]

Work History:
  15/12/2025 - Waiter at Tanaka Izakaya (5⭐)
  10/12/2025 - Server at Kimchi House (5⭐)
  ...

[Approve Application] [Reject] [Back]
```

---

#### 4.3 Approve/Reject Actions
**Approve:**
1. Update application: `status = 'approved'`, `approved_at = now()`
2. Generate QR code for check-in
3. Send notification to worker
4. Update job: `current_workers += 1`
5. If `current_workers == max_workers` → `job.status = 'filled'`

**Reject:**
1. Update application: `status = 'rejected'`, `rejected_at = now()`
2. Send notification to worker (polite message)
3. Keep job open

---

### 5️⃣ Check-in Management

#### 5.1 Scan Worker QR (`/owner/scan-qr`)
**Screen:**
```
Check-in Worker

[Camera Viewfinder]
  [QR Scanner Frame]

Recent Check-ins:
  ✅ [Worker] - 18:05 (5 min ago)
  ✅ [Worker] - 18:02 (8 min ago)

[Enter Code Manually]
```

**After Scan:**
```
✅ Check-in Success!

Worker: [Name]
Job: Waiter
Shift: 18:00 - 23:00
Checked in at: 18:05

[OK]
```

**Late Check-in (after shift_start_time):**
```
⚠️ Late Check-in
Worker: [Name]
Expected: 18:00
Actual: 18:15 (15 min late)

This will affect reliability score (-2 points)

[Confirm Check-in] [Cancel]
```

---

### 6️⃣ Job Completion

#### 6.1 Active Jobs (`/owner/jobs/active`)
**Screen:**
```
Active Jobs Today

For each job:
  [Job Card]
  Waiter - 18:00-23:00

  Workers: 2/2
  ✅ [Worker 1] - Checked in 18:05
  ✅ [Worker 2] - Checked in 18:03

  [Mark Complete] [View Details]
```

---

#### 6.2 Mark Job Complete
**Process:**
1. Click "Mark Complete"
2. Confirmation dialog:
   ```
   Confirm job completion?

   Job: Waiter
   Workers:
     ✓ [Worker 1] - On time
     ✓ [Worker 2] - On time

   Total pay: ₫1,200,000 (cash)

   [Cancel] [Confirm]
   ```
3. Update all applications: `status = 'completed'`
4. Update reliability scores
5. Prompt for worker ratings (optional)

---

#### 6.3 Rate Workers (`/owner/jobs/[id]/rate`)
**Screen:**
```
Rate Workers

[Worker 1]
  Performance: [⭐⭐⭐⭐⭐]
  Punctuality: [⭐⭐⭐⭐⭐]
  Communication: [⭐⭐⭐⭐⭐]
  Comment: [Optional text]

[Worker 2]
  ...

[Skip] [Submit Ratings]
```

**Action:**
- Save ratings (future feature - ratings table)
- Update worker avg rating
- Send thank you notification

---

## 🔧 Technical Implementation Details

### Database Enhancements Needed

#### 1. Add Verification Tables
```sql
-- Already exists: language_skills with verification_status

-- Add identity_verifications table
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

-- Add business_verifications table
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
```

#### 2. Add Profile Completion Tracking
```sql
ALTER TABLE profiles ADD COLUMN profile_completion_percentage INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN can_apply BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN can_post_jobs BOOLEAN DEFAULT FALSE;

-- Function to calculate completion %
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id UUID)
RETURNS INT AS $$
DECLARE
  completion INT := 0;
  profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile FROM profiles WHERE id = user_id;

  -- Basic info (20%)
  IF profile.full_name IS NOT NULL AND profile.phone_number IS NOT NULL THEN
    completion := completion + 20;
  END IF;

  -- Role selected (10%)
  IF profile.role IS NOT NULL THEN
    completion := completion + 10;
  END IF;

  -- Worker specific (70%)
  IF profile.role = 'worker' THEN
    -- Date of birth (10%)
    IF profile.date_of_birth IS NOT NULL THEN
      completion := completion + 10;
    END IF;

    -- Language skills (30%)
    IF EXISTS (SELECT 1 FROM language_skills WHERE user_id = profile.id AND verification_status = 'verified') THEN
      completion := completion + 30;
    END IF;

    -- Identity verification (30%)
    IF profile.is_verified THEN
      completion := completion + 30;
    END IF;
  END IF;

  -- Owner specific (70%)
  IF profile.role = 'owner' THEN
    -- Restaurant info (30%)
    IF profile.restaurant_name IS NOT NULL AND profile.restaurant_address IS NOT NULL THEN
      completion := completion + 30;
    END IF;

    -- Business verification (40%)
    IF EXISTS (SELECT 1 FROM business_verifications WHERE owner_id = profile.id AND status = 'verified') THEN
      completion := completion + 40;
    END IF;
  END IF;

  RETURN completion;
END;
$$ LANGUAGE plpgsql;
```

---

### New API Endpoints/Services Needed

#### Worker Services
```typescript
// lib/services/worker-onboarding.service.ts
export class WorkerOnboardingService {
  async completeBasicProfile(userId: string, data: BasicProfileData)
  async addLanguageSkill(userId: string, skill: LanguageSkillData)
  async uploadIdentityDocuments(userId: string, files: Files)
  async getProfileCompletion(userId: string): Promise<number>
  async canApplyToJobs(userId: string): Promise<boolean>
}

// lib/services/worker-application.service.ts
export class WorkerApplicationService {
  async applyToJob(workerId: string, jobId: string)
  async withdrawApplication(applicationId: string)
  async getMyApplications(workerId: string, status?: ApplicationStatus)
  async getQRCode(applicationId: string): Promise<QRCodeData>
}
```

#### Owner Services
```typescript
// lib/services/owner-onboarding.service.ts
export class OwnerOnboardingService {
  async completeRestaurantProfile(userId: string, data: RestaurantData)
  async uploadBusinessLicense(userId: string, file: File)
  async getProfileCompletion(userId: string): Promise<number>
  async canPostJobs(userId: string): Promise<boolean>
}

// lib/services/owner-job.service.ts
export class OwnerJobService {
  async createJob(ownerId: string, jobData: JobData): Promise<Job>
  async updateJob(jobId: string, updates: Partial<JobData>)
  async getMyJobs(ownerId: string, status?: JobStatus)
  async getJobApplications(jobId: string): Promise<JobApplication[]>
  async approveApplication(applicationId: string)
  async rejectApplication(applicationId: string, reason?: string)
}

// lib/services/checkin.service.ts
export class CheckinService {
  async scanWorkerQR(qrData: string, ownerId: string)
  async validateQRCode(qrData: string): Promise<boolean>
  async completeJob(jobId: string, ownerId: string)
  async handleNoShow(applicationId: string)
}
```

---

### New Pages/Routes Needed

#### Shared/Auth
- `/signup` - Registration form
- `/login` - Login form
- `/onboarding/role` - Role selection

#### Worker Routes
- `/onboarding/worker/profile` - Basic profile
- `/profile/worker/languages` - Language skills
- `/profile/worker/identity` - Identity verification
- `/worker/dashboard` - Worker home
- `/worker/jobs` - My jobs (upcoming/pending/completed)
- `/worker/jobs/[id]` - Job detail
- `/worker/jobs/[id]/qr` - QR code view

#### Owner Routes
- `/onboarding/owner/profile` - Restaurant profile
- `/owner/dashboard` - Owner home
- `/owner/jobs` - My job listings
- `/owner/jobs/new` - Create job
- `/owner/jobs/[id]/edit` - Edit job
- `/owner/jobs/[id]/applications` - View applications
- `/owner/workers/[id]` - Worker profile view
- `/owner/scan-qr` - QR scanner
- `/owner/jobs/[id]/rate` - Rate workers

#### Admin Routes (Future)
- `/admin/verifications` - Review documents
- `/admin/users` - User management

---

### Components Needed

#### Shared
- `<RolePicker />` - Role selection cards
- `<ImageUpload />` - Document upload with preview
- `<ProfileCompletionBanner />` - Soft block banner
- `<QRCodeDisplay />` - Show QR code
- `<QRScanner />` - Camera-based scanner

#### Worker
- `<LanguageSkillForm />` - Add language skill
- `<IdentityVerificationForm />` - Upload ID
- `<ApplicationCard />` - Application list item
- `<JobDetailModal />` - Job details modal

#### Owner
- `<JobForm />` - Create/edit job
- `<ApplicationList />` - Application management
- `<WorkerProfileCard />` - Worker info card
- `<CheckinList />` - Recent check-ins

---

## 🚨 Edge Cases & Error Handling

### Worker Edge Cases

1. **Multiple applications to same job**
   - Prevent: Check existing application before allowing new one
   - UI: Disable "Apply" button if already applied

2. **QR code expired**
   - Show error: "QR expired. Contact support."
   - Allow regeneration if < 1 hour after shift start

3. **Late check-in**
   - Warn owner: "Worker late: -2 reliability points"
   - Allow owner to decide: accept or mark no-show

4. **Account frozen**
   - Block all job applications
   - Show banner: "Account frozen until [date]. Reason: No-show"

5. **Language verification rejected**
   - Notify worker with reason
   - Allow re-upload

### Owner Edge Cases

1. **Job filled while reviewing applications**
   - Lock approvals when `current_workers == max_workers`
   - Show: "Job already filled"

2. **Worker cancels after approval**
   - Allow cancellation up to 24h before shift
   - Penalty: -5 reliability points
   - Re-open job slot

3. **Worker no-show**
   - Auto-detect after 2 hours
   - Apply penalties automatically
   - Notify owner + re-open job

4. **Multiple workers same QR scan**
   - Validate QR not already used
   - One-time use per check-in

5. **Business license rejected**
   - Notify owner with reason
   - Block job posting until verified

---

## 📊 Success Metrics

### Worker KPIs
- Profile completion rate: > 80%
- Application → Approval rate: > 60%
- No-show rate: < 5%
- Avg reliability score: > 85

### Owner KPIs
- Job post → Application rate: > 5 apps/job
- Approval → Completion rate: > 90%
- Time to fill job: < 48 hours
- Worker rating: > 4.5/5

### Platform KPIs
- Instant Book rate: > 40%
- Worker retention (30-day): > 60%
- Owner retention (30-day): > 70%
- Verification approval time: < 24 hours

---

## 🎯 MVP Priorities

### Phase 1 - Core Flows (Must Have)
1. Registration + role selection ✅
2. Worker profile completion ✅
3. Owner restaurant profile ✅
4. Basic verification upload ✅
5. Job posting ✅
6. Job discovery ✅
7. Application workflow ✅
8. Instant Book logic ✅

### Phase 2 - Job Execution (Must Have)
9. QR code generation ✅
10. QR scanning + check-in ✅
11. Job completion flow ✅
12. No-show handling ✅
13. Reliability scoring ✅

### Phase 3 - Polish (Nice to Have)
14. Rating system ⭐
15. Notifications (push/email) 📧
16. Worker/Owner profiles 👤
17. Advanced search/filters 🔍
18. Analytics dashboard 📊

### Phase 4 - Scale (Future)
19. Payment integration 💰
20. Multi-language support 🌏
21. Mobile apps (React Native) 📱
22. Admin verification panel 🛡️

---

## ⚠️ Critical Warnings & Recommendations

### Security
❌ **Don't:** Store sensitive docs without encryption
✅ **Do:** Use Supabase Storage with RLS policies

❌ **Don't:** Generate predictable QR codes
✅ **Do:** Use UUID + HMAC signature + expiry

❌ **Don't:** Trust client-side validation
✅ **Do:** Validate all actions on server (RLS + triggers)

### UX
❌ **Don't:** Force all verification upfront (users will bounce)
✅ **Do:** Gradual verification with soft blocks

❌ **Don't:** Block browsing (kills discovery)
✅ **Do:** Allow browse, block action (apply/post)

❌ **Don't:** Auto-approve without verification
✅ **Do:** Instant Book only for fully verified workers

### Performance
❌ **Don't:** Load all jobs at once
✅ **Do:** Pagination + infinite scroll

❌ **Don't:** Fetch full applications on dashboard
✅ **Do:** Lazy load, summary cards first

❌ **Don't:** Real-time QR validation per scan
✅ **Do:** Cache validation logic, check signature first

---

## 🔄 Iterative Improvements (Post-MVP)

### Smart Matching
- ML-based job recommendations
- Auto-notify matched workers
- Predictive scheduling

### Enhanced Verification
- Video interview for high-value jobs
- Live language assessment quiz
- Blockchain certificates (overkill for MVP)

### Community Features
- Worker forums/groups
- Owner peer reviews
- Best practices sharing

### Monetization
- Commission on completed jobs (5-10%)
- Premium subscriptions (priority listing)
- Promoted job posts
- Background check services

---

## 📋 Implementation Checklist

### Database
- [ ] Create identity_verifications table
- [ ] Create business_verifications table
- [ ] Add profile completion fields
- [ ] Write completion calculation function
- [ ] Add RLS policies for new tables

### Backend Services
- [ ] WorkerOnboardingService
- [ ] OwnerOnboardingService
- [ ] WorkerApplicationService
- [ ] OwnerJobService
- [ ] CheckinService
- [ ] QRCodeService

### Frontend Components
- [ ] RolePicker
- [ ] ImageUpload
- [ ] ProfileCompletionBanner
- [ ] QRCodeDisplay
- [ ] QRScanner
- [ ] LanguageSkillForm
- [ ] IdentityVerificationForm
- [ ] JobForm
- [ ] ApplicationList
- [ ] WorkerProfileCard

### Pages
- [ ] /signup
- [ ] /login
- [ ] /onboarding/role
- [ ] /onboarding/worker/profile
- [ ] /profile/worker/languages
- [ ] /profile/worker/identity
- [ ] /onboarding/owner/profile
- [ ] /worker/dashboard
- [ ] /worker/jobs
- [ ] /owner/dashboard
- [ ] /owner/jobs/new
- [ ] /owner/jobs/[id]/applications
- [ ] /owner/scan-qr

### Testing
- [ ] E2E: Full worker flow
- [ ] E2E: Full owner flow
- [ ] QR code security test
- [ ] No-show automation test
- [ ] Instant Book criteria test
- [ ] Profile completion calculation test

---

## 🤔 Unresolved Questions

1. **Admin verification workflow** - Manual review UI needed? Or auto-approve with AI + manual spot checks?

2. **Notification system** - Email only for MVP? Or need push notifications (Firebase)?

3. **QR code security** - Current design secure enough? Or need additional layers (rate limiting, device fingerprint)?

4. **Reliability score display** - Show exact number or badge levels (Bronze/Silver/Gold)?

5. **Multi-language support** - Vietnamese only for MVP? English needed?

6. **Profile photos** - Required or optional? Moderation needed?

7. **Cancellation policy** - How many hours before shift can worker cancel without penalty?

8. **Payment proof** - Manual payment - need receipt/confirmation system?

---

## 📝 Next Steps

Would you like me to create a **detailed implementation plan** with:
- Task breakdown
- Estimated timelines
- Technical specifications
- Database migrations
- API contracts
- Component wireframes

**Use `/plan` command to proceed with implementation planning.**

---

**END OF BRAINSTORMING SESSION**

