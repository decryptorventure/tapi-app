-- Migration: Add admin-related columns to profiles
-- Date: 2026-01-27
-- Purpose: Support admin dashboard user management features

-- Add account lock/freeze columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_account_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMPTZ DEFAULT NULL;

-- Add reliability score column (if not exists from initial schema)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100);

-- Add is_verified column (if not exists)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add email column (some users authenticate via phone only)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT DEFAULT NULL;

-- Comments
COMMENT ON COLUMN profiles.is_account_frozen IS 'Whether the account is currently locked/frozen by admin';
COMMENT ON COLUMN profiles.frozen_until IS 'Timestamp when the account lock expires (NULL = permanently frozen or not frozen)';
COMMENT ON COLUMN profiles.reliability_score IS 'Worker reliability score from 0-100, starts at 100';
COMMENT ON COLUMN profiles.is_verified IS 'Whether the user has completed identity verification';
