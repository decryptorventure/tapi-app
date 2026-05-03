# Database Migrations (Squashed)

This directory contains consolidated SQL migrations for the Tapy platform. The migrations have been squashed to simplify the codebase and ensure a clean starting point.

## Migrations List

### 001_initial_core.sql
- Initial Extensions (uuid-ossp)
- Enums (roles, language levels, verification status)
- `profiles` table (fully extended for workers, owners, and admins)
- Verification tables (`identity_verifications`, `business_verifications`)
- Core Auth triggers (`handle_new_user`)

### 002_jobs_and_flow.sql
- Job and Application Enums
- `jobs` table
- `job_applications` table (with reminder and cancellation tracking)
- `checkins` table (with QR scanning support)
- `work_experiences` table
- Core RLS policies for jobs and applications

### 003_notifications_and_messaging.sql
- `notifications` table
- `chat_messages` table
- Notification triggers for applications and messages
- Messaging RLS policies

### 004_financial_and_admin.sql
- `withdrawals` table
- `favorite_workers` table
- `payment_methods` table
- Admin columns and related RLS policies

### 005_worker_systems.sql
- `worker_grades` system
- `badges` and `worker_badges` system
- `reviews` system
- `penalties` system

### 006_safety_and_cleanup.sql
- `job_qr_codes` table and auto-generation triggers
- `cleanup_expired_jobs()` RPC function (latest time-based logic)
- QR security policies

## How to Apply

If you are setting up a fresh database, apply these in order from 001 to 006.
If your database is already up to date, these consolidated files serve as the new baseline for future migrations.
