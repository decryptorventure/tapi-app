-- Migration: Fix job visibility policy for workers
-- Issue: Workers can only see jobs with status='open', causing "job not found" errors
-- Solution: Allow all authenticated users to view all jobs

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Workers can view open jobs" ON public.jobs;

-- Create new permissive policy for reading jobs
-- All authenticated users can view all jobs (read-only)
CREATE POLICY "Authenticated users can view all jobs" ON public.jobs
  FOR SELECT 
  TO authenticated
  USING (true);

-- Note: Write permissions remain unchanged:
-- - "Owners can create their own jobs" for INSERT
-- - "Owners can manage their own jobs" for UPDATE/DELETE

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Job RLS policy updated: All authenticated users can now view all jobs';
END $$;
