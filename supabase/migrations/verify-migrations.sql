-- Verification Script for Phase 1 Migrations
-- Run this after applying all migrations to verify success

-- ============================================
-- 1. Check Tables Exist
-- ============================================
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('identity_verifications', 'business_verifications');

  IF table_count = 2 THEN
    RAISE NOTICE '✓ Verification tables created successfully';
  ELSE
    RAISE WARNING '✗ Missing verification tables (found % of 2)', table_count;
  END IF;
END $$;

-- ============================================
-- 2. Check Profile Columns Exist
-- ============================================
DO $$
DECLARE
  column_count INT;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN (
      'profile_completion_percentage',
      'can_apply',
      'can_post_jobs',
      'onboarding_completed',
      'last_active_at'
    );

  IF column_count = 5 THEN
    RAISE NOTICE '✓ Profile columns added successfully';
  ELSE
    RAISE WARNING '✗ Missing profile columns (found % of 5)', column_count;
  END IF;
END $$;

-- ============================================
-- 3. Check Functions Exist
-- ============================================
DO $$
DECLARE
  function_count INT;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'calculate_profile_completion',
      'update_profile_completion',
      'update_profile_on_language_change',
      'update_profile_on_identity_verified'
    );

  IF function_count = 4 THEN
    RAISE NOTICE '✓ Functions created successfully';
  ELSE
    RAISE WARNING '✗ Missing functions (found % of 4)', function_count;
  END IF;
END $$;

-- ============================================
-- 4. Check Triggers Exist
-- ============================================
DO $$
DECLARE
  trigger_count INT;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
    AND trigger_name IN (
      'trigger_update_profile_completion',
      'trigger_language_skills_update_profile',
      'trigger_identity_verified'
    );

  IF trigger_count = 3 THEN
    RAISE NOTICE '✓ Triggers created successfully';
  ELSE
    RAISE WARNING '✗ Missing triggers (found % of 3)', trigger_count;
  END IF;
END $$;

-- ============================================
-- 5. Check RLS Policies Exist
-- ============================================
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('identity_verifications', 'business_verifications');

  IF policy_count >= 4 THEN
    RAISE NOTICE '✓ RLS policies created successfully (% policies)', policy_count;
  ELSE
    RAISE WARNING '✗ Missing RLS policies (found % policies, expected at least 4)', policy_count;
  END IF;
END $$;

-- ============================================
-- 6. Check Indexes Exist
-- ============================================
DO $$
DECLARE
  index_count INT;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%verifications%';

  IF index_count >= 4 THEN
    RAISE NOTICE '✓ Indexes created successfully (% indexes)', index_count;
  ELSE
    RAISE WARNING '✗ Missing indexes (found % indexes, expected at least 4)', index_count;
  END IF;
END $$;

-- ============================================
-- Summary Report
-- ============================================
SELECT
  'Migration Verification Complete' AS status,
  NOW() AS checked_at;

-- Show all verification tables structure
\d identity_verifications
\d business_verifications

-- Show profile completion columns
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'profile_completion_percentage',
    'can_apply',
    'can_post_jobs',
    'onboarding_completed',
    'last_active_at'
  )
ORDER BY ordinal_position;
