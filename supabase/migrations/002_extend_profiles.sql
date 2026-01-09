-- Migration: Extend profiles table with completion tracking
-- Date: 2026-01-07
-- Phase: 1 - Foundation

-- Add profile completion tracking columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_completion_percentage INT DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS can_apply BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_post_jobs BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing profiles to calculate initial completion
-- This will be recalculated by trigger, but good to have baseline
UPDATE public.profiles
SET profile_completion_percentage = 20
WHERE full_name IS NOT NULL AND phone_number IS NOT NULL;

-- Comments
COMMENT ON COLUMN profiles.profile_completion_percentage IS 'Calculated percentage of profile completion (0-100)';
COMMENT ON COLUMN profiles.can_apply IS 'Whether worker can apply to jobs (≥80% completion)';
COMMENT ON COLUMN profiles.can_post_jobs IS 'Whether owner can post jobs (≥70% completion)';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user completed initial onboarding flow';
