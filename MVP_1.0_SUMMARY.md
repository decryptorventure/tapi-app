# Tapi MVP 1.0 - Project Documentation Summary

## Project Overview
Tapi is a Just-in-Time recruitment platform connecting Japanese/Korean restaurants in Vietnam with verified part-time staff.

## Core Features (v1.0)
### 1. Unified Authentication
- Integrated Supabase Auth.
- Role-based profiles (Worker/Owner).

### 2. Intelligent Job Matching
- 5-criteria evaluation: Language, Level, Reliability Score, Account Status, Verification Status.
- **Instant Book:** Auto-approval for highly qualified workers.
- **Request-to-Book:** Manual approval for others.

### 3. Worker Feed & Discovery
- High-performance job feed with real-time filtering.
- Swipeable image carousels for job previews.
- Transparent pay rates and requirements.

### 4. Owner Management Suite
- Dashboard with real-time stats (Active Jobs, Pending Apps, Total Workers).
- Full Job Lifecycle: Create, Edit, View Applications, Approve/Reject.
- Profile Branding: Upload restaurant logos and cover photos.

### 5. QR Check-in System
- Dynamic QR code generation for approved applications.
- Scanner interface for owners to verify attendance.
- Automated check-in/out timestamps.

## Technical Architecture
- **Framework:** Next.js 14 (App Router).
- **Styling:** Tailwind CSS + Shadcn Elements.
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS).
- **Storage:** Supabase Storage for branding and job images.
- **i18n:** Full support for Vietnamese, English, Japanese, and Korean.

## Development Status
- **Version:** 1.0.0 (MVP)
- **Status:** Stable / Production Ready for pilot.
- **Next Steps:** Payment gateway integration, e-KYC, and push notifications.

---
*Developed by Solo Builder with Antigravity AI @ 2026*
