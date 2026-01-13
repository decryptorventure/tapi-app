-- Phase 2: Add reminder and cancellation tracking
-- Supports shift reminders and tiered cancellation penalties

-- 1. Add reminder tracking columns to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT FALSE;

-- 2. Add cancellation tracking columns
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_penalty INTEGER DEFAULT 0;

-- 3. Add index for upcoming shift queries (for reminder system)
CREATE INDEX IF NOT EXISTS idx_applications_shift_reminders 
ON public.job_applications (status, reminder_24h_sent, reminder_1h_sent)
WHERE status = 'approved';

-- 4. Create function to get upcoming shifts needing reminders
CREATE OR REPLACE FUNCTION get_shifts_needing_24h_reminder()
RETURNS TABLE (
  application_id UUID,
  worker_id UUID,
  job_id UUID,
  job_title TEXT,
  shift_date DATE,
  shift_start_time TIME,
  restaurant_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ja.id as application_id,
    ja.worker_id,
    ja.job_id,
    j.title as job_title,
    j.shift_date,
    j.shift_start_time,
    p.restaurant_name
  FROM public.job_applications ja
  JOIN public.jobs j ON j.id = ja.job_id
  JOIN public.profiles p ON p.id = j.owner_id
  WHERE ja.status = 'approved'
    AND ja.reminder_24h_sent = FALSE
    AND (j.shift_date + j.shift_start_time) > NOW()
    AND (j.shift_date + j.shift_start_time) <= NOW() + INTERVAL '25 hours'
    AND (j.shift_date + j.shift_start_time) > NOW() + INTERVAL '23 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_shifts_needing_1h_reminder()
RETURNS TABLE (
  application_id UUID,
  worker_id UUID,
  job_id UUID,
  job_title TEXT,
  shift_date DATE,
  shift_start_time TIME,
  restaurant_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ja.id as application_id,
    ja.worker_id,
    ja.job_id,
    j.title as job_title,
    j.shift_date,
    j.shift_start_time,
    p.restaurant_name
  FROM public.job_applications ja
  JOIN public.jobs j ON j.id = ja.job_id
  JOIN public.profiles p ON p.id = j.owner_id
  WHERE ja.status = 'approved'
    AND ja.reminder_1h_sent = FALSE
    AND (j.shift_date + j.shift_start_time) > NOW()
    AND (j.shift_date + j.shift_start_time) <= NOW() + INTERVAL '70 minutes'
    AND (j.shift_date + j.shift_start_time) > NOW() + INTERVAL '50 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Mark reminder as sent
CREATE OR REPLACE FUNCTION mark_24h_reminder_sent(p_application_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.job_applications
  SET reminder_24h_sent = TRUE
  WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_1h_reminder_sent(p_application_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.job_applications
  SET reminder_1h_sent = TRUE
  WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
