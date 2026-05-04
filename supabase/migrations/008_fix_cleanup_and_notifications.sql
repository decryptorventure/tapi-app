-- ============================================
-- MIGRATION: 008_fix_cleanup_and_notifications
-- Fix: cleanup_expired_jobs should NOT reject 'working' applications
-- Fix: Add proper notification trigger for application status changes
-- Fix: Remove ALL old duplicate triggers on job_applications
-- ============================================

-- 1. Fix cleanup_expired_jobs: Do NOT auto-reject 'working' applications
-- Workers who have already checked in should complete their shift
CREATE OR REPLACE FUNCTION public.cleanup_expired_jobs()
RETURNS void AS $$
DECLARE
    current_vn_date DATE;
    current_vn_time TIME;
BEGIN
    current_vn_date := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'ICT')::DATE;
    current_vn_time := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'ICT')::TIME;

    -- Update jobs to expired
    UPDATE public.jobs
    SET status = 'expired', updated_at = NOW()
    WHERE (shift_date < current_vn_date OR (shift_date = current_vn_date AND shift_end_time::TIME < current_vn_time))
    AND status IN ('open', 'filled');

    -- Auto-reject ONLY 'pending' applications for expired jobs
    -- Do NOT reject 'approved' or 'working' - they should be handled manually by owner
    UPDATE public.job_applications
    SET status = 'rejected', updated_at = NOW()
    WHERE status = 'pending'
    AND job_id IN (SELECT id FROM public.jobs WHERE status = 'expired');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop ALL possible old notification triggers on job_applications
-- (they may have been created directly on the database with different names)
DROP TRIGGER IF EXISTS on_application_status_change ON public.job_applications;
DROP TRIGGER IF EXISTS on_application_update ON public.job_applications;
DROP TRIGGER IF EXISTS notify_application_update ON public.job_applications;
DROP TRIGGER IF EXISTS application_status_notification ON public.job_applications;
DROP TRIGGER IF EXISTS trigger_application_status ON public.job_applications;
DROP TRIGGER IF EXISTS on_application_status_update ON public.job_applications;

-- Also drop old functions that might exist
DROP FUNCTION IF EXISTS public.notify_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.on_application_status_update() CASCADE;

-- 3. Create the SINGLE correct notification trigger
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_job_title TEXT;
    v_message TEXT;
    v_title TEXT;
BEGIN
    -- Only fire when status actually changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Get job title
    SELECT title INTO v_job_title FROM public.jobs WHERE id = NEW.job_id;

    -- Build notification based on new status
    v_title := 'Cập nhật ứng tuyển';

    CASE NEW.status
        WHEN 'approved' THEN
            v_message := 'Đơn ứng tuyển của bạn cho việc làm ' || COALESCE(v_job_title, '') || ' đã được chấp nhận';
        WHEN 'rejected' THEN
            v_message := 'Đơn ứng tuyển của bạn cho việc làm ' || COALESCE(v_job_title, '') || ' đã bị từ chối';
        WHEN 'completed' THEN
            v_message := 'Ca làm việc ' || COALESCE(v_job_title, '') || ' đã hoàn thành. Cảm ơn bạn!';
        WHEN 'working' THEN
            -- Don't notify for 'working' status (check-in handles this)
            RETURN NEW;
        ELSE
            RETURN NEW;
    END CASE;

    -- Insert notification for the worker
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (NEW.worker_id, v_title, v_message, 'application_update', NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the ONE trigger
CREATE TRIGGER on_application_status_change
    AFTER UPDATE OF status ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_application_status_change();
