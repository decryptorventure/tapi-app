-- Fix RLS policies for reliability_history table
-- This is required for owners to log reliability changes when marking jobs complete

-- Allow owners to insert reliability history for workers they've hired
CREATE POLICY "Owners can insert reliability history for their workers"
ON public.reliability_history
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.job_applications ja
        JOIN public.jobs j ON ja.job_id = j.id
        WHERE ja.worker_id = user_id
        AND j.owner_id = auth.uid()
    )
);

-- Allow users to view their own reliability history
CREATE POLICY "Users can view their own reliability history"
ON public.reliability_history
FOR SELECT
USING (auth.uid() = user_id);

-- Also add completed_at column if missing
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
