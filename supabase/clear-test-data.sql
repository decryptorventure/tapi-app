-- ============================================
-- CLEAR ALL TEST DATA FROM SUPABASE
-- ============================================
-- ⚠️ WARNING: This will DELETE ALL data from your database!
-- Only run this on development/staging environment
-- DO NOT run on production!
-- ============================================

-- Step 1: Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Step 2: Delete data from all tables (in correct order to respect foreign keys)
-- Start with dependent tables first, then parent tables

-- Delete checkins (depends on job_applications)
DELETE FROM public.checkins;

-- Delete wallet transactions (depends on jobs, job_applications, profiles)
DELETE FROM public.wallet_transactions;

-- Delete reliability history (depends on profiles, jobs, job_applications)
DELETE FROM public.reliability_history;

-- Delete job applications (depends on jobs and profiles)
DELETE FROM public.job_applications;

-- Delete jobs (depends on profiles)
DELETE FROM public.jobs;

-- Delete language skills (depends on profiles)
DELETE FROM public.language_skills;

-- Delete profiles (will also delete auth.users via CASCADE)
-- ⚠️ This will delete all user accounts!
DELETE FROM public.profiles;

-- Step 3: Re-enable triggers
SET session_replication_role = DEFAULT;

-- Step 4: Reset sequences (optional - for auto-incrementing IDs)
-- Note: We use UUIDs so this is not needed, but included for reference
-- ALTER SEQUENCE IF EXISTS table_name_id_seq RESTART WITH 1;

-- Step 5: Verify all tables are empty
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'language_skills', COUNT(*) FROM public.language_skills
UNION ALL
SELECT 'jobs', COUNT(*) FROM public.jobs
UNION ALL
SELECT 'job_applications', COUNT(*) FROM public.job_applications
UNION ALL
SELECT 'checkins', COUNT(*) FROM public.checkins
UNION ALL
SELECT 'reliability_history', COUNT(*) FROM public.reliability_history
UNION ALL
SELECT 'wallet_transactions', COUNT(*) FROM public.wallet_transactions;

-- ============================================
-- RESULT: All tables should show 0 rows
-- ============================================
