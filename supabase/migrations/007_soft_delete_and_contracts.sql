-- ============================================
-- MIGRATION: 007_soft_delete_and_contracts
-- Phase: Admin & E-Contract
-- ============================================

-- 1. Soft Delete Support for Users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. E-Contract Support for Job Applications
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
