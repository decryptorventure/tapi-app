-- Function to cleanup expired jobs and their applications
-- This function marks jobs as 'expired' if the shift_date is in the past
-- and sets related pending/approved applications to 'rejected'

CREATE OR REPLACE FUNCTION public.cleanup_expired_jobs()
RETURNS void AS $$
DECLARE
    current_vn_date DATE;
    current_vn_time TIME;
BEGIN
    -- Get current date and time in Vietnam time (UTC+7)
    current_vn_date := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'ICT')::DATE;
    current_vn_time := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'ICT')::TIME;

    -- 1. Identify jobs that are past their shift_date or shift_end_time (for today)
    -- This includes 'open' and 'filled'.
    
    -- Update job status to 'expired'
    UPDATE public.jobs
    SET status = 'expired',
        updated_at = NOW()
    WHERE (
        shift_date < current_vn_date
        OR (shift_date = current_vn_date AND shift_end_time::TIME < current_vn_time)
    )
    AND status IN ('open', 'filled');

    -- 2. Handle applications for expired jobs
    -- Update 'pending', 'approved', and 'working' applications to 'rejected'
    -- Note: We include 'working' because if a job expires, the shift is over.
    
    UPDATE public.job_applications
    SET status = 'rejected',
        updated_at = NOW()
    WHERE status IN ('pending', 'approved', 'working')
    AND job_id IN (
        SELECT id 
        FROM public.jobs 
        WHERE status = 'expired'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We don't use a trigger or cron here to save resources.
-- This function will be called via RPC from the frontend.
