# Tapy Just-in-Time Recruitment Platform
## Project Overview & Product Development Requirements

**Version:** 1.0
**Last Updated:** 2026-01-07
**Project Type:** Just-in-Time Recruitment SaaS
**Status:** MVP Development

---

## Project Overview

### Vision
Tapy connects Japanese and Korean restaurants in Vietnam with verified, reliable part-time workers through an "Instant Book" system that enables immediate hiring based on language proficiency and reliability scores.

### Market Context
- **Target Market:** Japanese/Korean restaurants in Ho Chi Minh City, Vietnam
- **Primary Users:**
  - Restaurant Owners (job posters, hiring managers)
  - Part-time Workers (job seekers, service staff)
- **Problem Solved:** Reduce hiring friction; ensure language-qualified staff available on-demand
- **Competitive Advantage:** Instant booking for pre-qualified workers; language skill verification

### Business Model
- Freemium model (workers free, owners pay per booking/placement)
- Commission-based payment (planned wallet integration)
- Premium features: priority placement, guaranteed response times

---

## Product Development Requirements

### FUNCTIONAL REQUIREMENTS

#### FR-1: User Management & Authentication
- **Requirement:** Support two user roles (Worker, Owner) with independent authentication
- **Auth Method:** Supabase Phone OTP (primary), email fallback
- **Profile Management:**
  - Workers: Language skills, verification status, reliability score
  - Owners: Restaurant details, team management, contract templates
- **Status:** ✅ Implemented (Supabase Auth configured)

#### FR-2: Job Discovery & Feed
- **Requirement:** Display open jobs to workers with matching criteria
- **Features:**
  - Real-time job feed with filters (language, date, location)
  - Job card showing: job title, language requirement, shift time, location, pay rate
  - Search and sorting capabilities
  - Pagination for large datasets
- **Status:** ⚠️ Partial (basic feed exists, filtering/pagination pending)

#### FR-3: Job Application Workflow
- **Requirement:** Two-tier application system based on qualification
- **Instant Book Logic:** Auto-approve if worker meets ALL criteria:
  1. Possesses required language (verified)
  2. Language level meets/exceeds requirement
  3. Reliability score ≥ job minimum
  4. Account not frozen
  5. Identity verified (intro video)
- **Request to Book:** Manual owner approval for unqualified workers
- **Features:**
  - Application status tracking (pending, approved, rejected)
  - Qualification feedback messages (Vietnamese)
  - Owner dashboard for managing applications
- **Status:** ✅ Core logic implemented; UI pending

#### FR-4: Language Verification System
- **Requirement:** Support multiple language certification systems
- **Supported Languages & Levels:**
  - Japanese: JLPT (N5-N1, weighted 1-5)
  - Korean: TOPIK (1-6, weighted 1-6)
  - English: CEFR (A1-C2, weighted 1-6)
- **Verification Process:**
  - Certificate upload with expiry tracking
  - Admin approval workflow
  - Automatic level calculation
- **Status:** ✅ Algorithm implemented; upload/approval UI pending

#### FR-5: Reliability Scoring System
- **Requirement:** Track worker reliability across jobs
- **Scoring Rules:**
  - Initial score: 100 points
  - Job completion: +1 point
  - Late check-in: -2 points
  - No-show: -20 points + account freeze (7 days)
  - Early completion: +2 points
- **Freeze Mechanism:**
  - Auto-freeze on no-show
  - Temporary freeze (default 7 days)
  - Unfreezes automatically after expiry
  - Prevent Instant Book during freeze
- **Status:** ✅ Scoring algorithm implemented; audit logging pending

#### FR-6: Check-in/Check-out System
- **Requirement:** QR-code based geolocation verification
- **Features:**
  - Dynamic QR code generation per application
  - QR code expires after single use
  - Geolocation validation (100m radius)
  - Timestamp recording
  - Late arrival detection
- **Status:** ⚠️ Mock (QR token format; real implementation pending)

#### FR-7: Contract Management
- **Requirement:** Auto-generate and sign digital contracts
- **Features:**
  - Template-based contract generation
  - Auto-populated worker/job details
  - E-signature integration
  - Contract archive and retrieval
- **Status:** ⚠️ Stub (not yet implemented)

#### FR-8: Wallet & Payment Integration
- **Requirement:** Payment system for earnings and owner payments
- **Integration:** MoMo/ZaloPay APIs
- **Features:**
  - Worker wallet balance display
  - Transaction history
  - Payout requests (minimum threshold)
  - Owner payment for placements
- **Status:** ❌ Not yet implemented

---

### NON-FUNCTIONAL REQUIREMENTS

#### NFR-1: Performance
- **Response Time:** API responses < 200ms
- **Database Queries:** Indexed for <50ms response
- **Frontend Load:** Initial page load < 2s
- **Target:** Mobile-first (60%+ users on phones)

#### NFR-2: Security
- **Authentication:** Supabase RLS policies for all tables
- **Data Protection:** HTTPS-only communication
- **Privacy:** Compliance with Vietnam data protection
- **Rate Limiting:** 100 requests/minute per user
- **Input Validation:** All API inputs validated server-side

#### NFR-3: Reliability
- **Uptime:** 99.5% availability target
- **Database:** Automated daily backups
- **Error Recovery:** Automatic retry on transient failures
- **Monitoring:** Real-time error tracking

#### NFR-4: Scalability
- **Concurrent Users:** Support 10,000+ concurrent workers
- **Job Postings:** Handle 50,000+ open jobs
- **Database:** Sharding-ready schema design
- **Cache Strategy:** Redis caching for job listings (planned)

#### NFR-5: Usability
- **Accessibility:** WCAG 2.1 AA compliance
- **Mobile:** PWA with offline support
- **Localization:** Vietnamese primary, English fallback
- **User Testing:** Monthly usability surveys

---

## Technical Architecture

### Technology Stack
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript 5.4
- **UI Library:** Shadcn/UI, Tailwind CSS 3.4
- **State Management:** React Query 5.20 (server state), Zustand 4.5 (UI state, planned)
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Database:** PostgreSQL 15+
- **PWA:** next-pwa for offline capability
- **Deployment:** Vercel

### Core Database Tables
1. `profiles` - User accounts (workers + owners)
2. `language_skills` - Language certifications with levels
3. `jobs` - Job postings with requirements
4. `job_applications` - Application records with Instant Book flag
5. `checkins` - Check-in/out records with geolocation
6. `reliability_history` - Score change audit log
7. `wallet_transactions` - Payment records

### System Architecture
```
┌─────────────────────────────────────────┐
│       User Interface (Next.js)          │
│   React Components + Shadcn/UI          │
└─────────────────────┬───────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │ React Query / Zustand     │
        │ State Management          │
        └─────────────┬─────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐  ┌────────▼────────┐  ┌────▼──────┐
│  Hooks  │  │  Services Layer │  │  Utilities │
│Auth/Job │  │  Business Logic │  │  & Helpers │
└───┬────┘  └────────┬────────┘  └────┬──────┘
    │                │                │
    └────────────────┼────────────────┘
                     │
            ┌────────▼────────┐
            │ Supabase Client │
            │   Type-safe     │
            └────────┬────────┘
                     │
        ┌────────────┴────────────┐
        │    Supabase (Backend)   │
        │ PostgreSQL + Auth + RLS │
        └─────────────────────────┘
```

---

## Key Business Logic

### Instant Book Qualification Algorithm
```
evaluateWorkerQualification(worker, jobRequirements)
  ├─ hasLanguageSkill? ✓
  ├─ levelMeetsRequirement? ✓
  ├─ reliabilityScoreOK? ✓
  ├─ accountNotFrozen? ✓
  └─ isVerified? ✓
       └─ ALL true → INSTANT_BOOK
       └─ ANY false → REQUEST_TO_BOOK
```

### Language Level Comparison
- JLPT: N5=1, N4=2, N3=3, N2=4, N1=5
- TOPIK: 1=1, 2=2, 3=3, 4=4, 5=5, 6=6
- CEFR: A1=1, A2=2, B1=3, B2=4, C1=5, C2=6
- Comparison: workerLevel >= requiredLevel

### Reliability Scoring
```
Initial: 100
+ Complete job: +1
+ Early: +2
- Late (>15min): -2
- No-show: -20 + FREEZE_7_DAYS
```

---

## Current Implementation Status

### ✅ COMPLETED
- [x] Supabase authentication setup
- [x] Database schema design (7 tables)
- [x] Job matching algorithm (lib/job-matching.ts)
- [x] Application workflow (lib/services/job-application.service.ts)
- [x] Language level comparison system
- [x] Reliability scoring rules
- [x] Job feed UI (basic)
- [x] Job card component
- [x] Toast notifications
- [x] Type-safe database client

### ⚠️ IN PROGRESS / PARTIAL
- [ ] Job discovery filters and search
- [ ] Pagination for job listings
- [ ] Owner dashboard
- [ ] Worker onboarding flow
- [ ] QR code generation (currently mock token format)
- [ ] Geolocation check-in validation

### ❌ NOT YET IMPLEMENTED
- [ ] E-contract generation and signing
- [ ] Wallet and payment integration
- [ ] Push notifications
- [ ] Admin approval for language certificates
- [ ] Worker/Owner profile UI
- [ ] Analytics and reporting
- [ ] Rate limiting
- [ ] Audit logging

---

## Development Roadmap

### Phase 1: MVP (Current)
- **Timeline:** Jan-Feb 2026
- **Goals:**
  - Core job application workflow
  - Instant Book functionality
  - Language verification
  - Reliability scoring
- **Deliverables:**
  - Worker job discovery
  - Owner application dashboard
  - Basic onboarding

### Phase 2: Enhanced Features
- **Timeline:** Mar-Apr 2026
- **Goals:**
  - QR check-in system
  - Contract management
  - Wallet integration
- **Deliverables:**
  - Geolocation check-in
  - Digital contracts
  - Payment system

### Phase 3: Scale & Optimize
- **Timeline:** May+ 2026
- **Goals:**
  - Performance optimization
  - Advanced analytics
  - Marketing integrations
- **Deliverables:**
  - Search/filtering enhancements
  - Admin dashboard
  - API for partner integrations

---

## Success Metrics

### User Acquisition
- 1,000 workers registered (Month 1)
- 500 restaurant owners (Month 1)
- 50% month-over-month growth

### Engagement
- 40% weekly active users
- 30+ jobs posted daily
- 80% Instant Book approval rate (target)

### Business
- 0% payment disputes
- 95% on-time job completion
- Average reliability score: 90+

### Technical
- 99.5% uptime
- <200ms API response time
- <2s page load time
- <1% error rate

---

## Risk Assessment

### Technical Risks
- **Geolocation spoofing:** Implement multi-factor verification
- **Database overload:** Implement caching and indexing
- **Payment integration complexity:** Start with mock, expand gradually

### Business Risks
- **Low adoption:** Partner with restaurant associations
- **Payment disputes:** Clear policies and escrow system
- **Worker fraud:** Stringent verification requirements

### Mitigation Strategies
- Regular security audits
- A/B testing for UI/UX
- Strong customer support
- Feedback loop from users

---

## Design Principles

### 1. Speed
- Fast job matching and application
- Instant feedback to users
- Real-time updates

### 2. Trust
- Verified workers only
- Transparent scoring system
- Reliable payment

### 3. Simplicity
- Intuitive UI for non-technical users
- Minimal steps to apply
- Clear qualification messaging

### 4. Fairness
- Equal opportunity for all workers
- Transparent matching algorithm
- No hidden fees

---

## Dependencies & Constraints

### External Dependencies
- Supabase API uptime
- Google Maps API availability
- MoMo/ZaloPay payment APIs

### Technical Constraints
- Next.js deployment limited to Vercel
- RLS policy limitations in Supabase
- Mobile storage limits for PWA

### Business Constraints
- Vietnam data residency requirements
- Phone verification rate limits
- Payment processor limits

---

## Questions & Decisions Pending

1. **Wallet System:** MoMo, ZaloPay, or Stripe?
2. **Commission Structure:** Per-booking, percentage, or hybrid?
3. **Geographic Expansion:** HCMC first, then Hanoi/Da Nang?
4. **Premium Features:** Priority placement? Guaranteed response?
5. **Contract Templates:** Industry standard or custom per restaurant?

