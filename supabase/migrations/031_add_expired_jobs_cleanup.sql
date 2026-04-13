-- Function to cleanup expired jobs and their applications
-- This function marks jobs as 'expired' if the shift_date is in the past
-- and sets related pending/approved applications to 'rejected'

CREATE OR REPLACE FUNCTION public.cleanup_expired_jobs()
RETURNS void AS $$
DECLARE
    current_vn_date DATE;
BEGIN
    -- Get current date in Vietnam time (UTC+7)
    current_vn_date := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'ICT')::DATE;

    -- 1. Identify jobs that are past their shift_date and still in active statuses
    -- This includes 'open' and 'filled'.
    -- 'completed' and 'cancelled' are final statuses.
    
    -- Update job status to 'expired'
    UPDATE public.jobs
    SET status = 'expired',
        updated_at = NOW()
    WHERE shift_date < current_vn_date
      AND status IN ('open', 'filled');

    -- 2. Handle applications for expired jobs
    -- For any job that is now 'expired' (or was already expired but has leftover apps)
    -- Update 'pending' and 'approved' applications to 'rejected'
    
    UPDATE public.job_applications
    SET status = 'rejected',
        updated_at = NOW()
    WHERE status IN ('pending', 'approved', 'working')
      AND job_id IN (
          SELECT id 
          FROM public.jobs 
          WHERE shift_date < current_vn_date
      );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We don't use a trigger or cron here to save resources.
-- This function will be called via RPC from the frontend.
