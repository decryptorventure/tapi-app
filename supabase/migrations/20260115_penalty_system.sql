-- ============================================
-- MIGRATION: Penalty System Enhancement
-- Add freeze columns to profiles
-- Date: 2026-01-15
-- ============================================

-- 1. Add freeze columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS freeze_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS freeze_reason VARCHAR(100);

-- 2. Add index for frozen status
CREATE INDEX IF NOT EXISTS idx_profiles_frozen ON public.profiles(is_frozen);

-- 3. Add constraint to ensure reliability_score is between 0 and 100
ALTER TABLE public.profiles 
  ADD CONSTRAINT check_reliability_score 
  CHECK (reliability_score >= 0 AND reliability_score <= 100);

-- Note: If constraint fails, first fix out-of-range values:
-- UPDATE public.profiles SET reliability_score = GREATEST(0, LEAST(100, reliability_score));

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
