-- RLS Policy Verification Script
-- Run these queries in Supabase SQL Editor to verify RLS policies work correctly
-- Each query should be run AS a specific user role

-- ===========================================
-- 1. JOBS TABLE ISOLATION
-- ===========================================

-- Test: Owner A should NOT see Owner B's jobs
-- Expected: 0 rows if queried as Owner A looking for Owner B's data

-- List all jobs with their owners (admin view for comparison)
SELECT id, title, owner_id, status FROM public.jobs LIMIT 10;

-- ===========================================
-- 2. JOB APPLICATIONS ISOLATION
-- ===========================================

-- Test: Worker should only see their own applications
-- Run as Worker: Should only return worker's own applications

-- Test: Owner should only see applications for their jobs
-- Compare: Check if any application.job.owner_id != current_user

SELECT 
  ja.id,
  ja.worker_id,
  ja.job_id,
  j.owner_id as job_owner,
  ja.status
FROM public.job_applications ja
JOIN public.jobs j ON j.id = ja.job_id
LIMIT 10;

-- ===========================================
-- 3. CHECKINS TABLE ISOLATION
-- ===========================================

-- Test: Users can only see checkins for their applications
SELECT 
  c.id,
  c.application_id,
  ja.worker_id,
  j.owner_id
FROM public.checkins c
JOIN public.job_applications ja ON ja.id = c.application_id
JOIN public.jobs j ON j.id = ja.job_id
LIMIT 10;

-- ===========================================
-- 4. CHAT MESSAGES ISOLATION
-- ===========================================

-- Test: Only participants can see messages
SELECT 
  cm.id,
  cm.application_id,
  cm.sender_id,
  ja.worker_id,
  j.owner_id
FROM public.chat_messages cm
JOIN public.job_applications ja ON ja.id = cm.application_id
JOIN public.jobs j ON j.id = ja.job_id
LIMIT 10;

-- ===========================================
-- 5. NOTIFICATIONS ISOLATION
-- ===========================================

-- Test: Users can only see their own notifications
SELECT 
  id,
  user_id,
  title,
  type,
  is_read
FROM public.notifications
LIMIT 10;

-- ===========================================
-- 6. VERIFY RLS IS ENABLED
-- ===========================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'profiles',
  'jobs',
  'job_applications',
  'checkins',
  'notifications',
  'chat_messages',
  'language_skills',
  'wallet_transactions'
);

-- Expected: rowsecurity = true for all tables

-- ===========================================
-- 7. LIST ALL RLS POLICIES
-- ===========================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
