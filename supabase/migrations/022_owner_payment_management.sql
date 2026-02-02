-- Migration: Add owner_id and job linking to withdrawal_requests
-- Date: 2026-02-02
-- Purpose: Enable Owner to directly manage Worker payments for MVP (manual payment flow)

-- 1. Add owner_id column to withdrawal_requests
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id),
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.job_applications(id);

-- 2. Create index for owner lookup
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_owner ON public.withdrawal_requests(owner_id);

-- 3. Add RLS policy for Owners to view withdrawal requests for their jobs
CREATE POLICY "Owners can view withdrawal requests for their jobs" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = owner_id);

-- 4. Add RLS policy for Owners to update (mark as paid) withdrawal requests
CREATE POLICY "Owners can update withdrawal requests for their jobs" ON public.withdrawal_requests
  FOR UPDATE USING (auth.uid() = owner_id);

-- 5. Rename table for clarity (optional - skip if prefer to keep name)
-- This step creates a view with better name while maintaining compatibility
CREATE OR REPLACE VIEW public.payment_requests AS
SELECT 
  id,
  user_id as worker_id,
  owner_id,
  job_id,
  application_id,
  amount_vnd,
  payment_method,
  payment_info,
  CASE 
    WHEN status = 'completed' THEN 'paid'
    ELSE status 
  END as status,
  admin_notes as notes,
  processed_at as paid_at,
  created_at,
  updated_at
FROM public.withdrawal_requests;
