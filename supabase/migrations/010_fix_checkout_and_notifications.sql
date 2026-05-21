-- ========================================================
-- MIGRATION: 010_fix_checkout_and_notifications
-- Clean up all potential notification triggers and functions
-- Absolute removal of rejected/cancelled application notifications
-- ========================================================

-- 1. Drop ALL possible triggers on job_applications to ensure clean slate
DROP TRIGGER IF EXISTS on_application_status_change ON public.job_applications CASCADE;
DROP TRIGGER IF EXISTS on_application_update ON public.job_applications CASCADE;
DROP TRIGGER IF EXISTS notify_application_update ON public.job_applications CASCADE;
DROP TRIGGER IF EXISTS application_status_notification ON public.job_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_status ON public.job_applications CASCADE;
DROP TRIGGER IF EXISTS on_application_status_update ON public.job_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.job_applications CASCADE;
DROP TRIGGER IF EXISTS application_notification_trigger ON public.job_applications CASCADE;

-- 2. Drop all potential legacy functions
DROP FUNCTION IF EXISTS public.notify_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.on_application_status_update() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_application_status_change() CASCADE;

-- 3. Recreate the absolute, unified notification function
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_job_title TEXT;
    v_message TEXT;
    v_title TEXT;
BEGIN
    -- Guard: Only notify on actual status changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Fetch job title for context
    SELECT title INTO v_job_title FROM public.jobs WHERE id = NEW.job_id;

    -- Custom notification rules based on target status
    CASE NEW.status
        WHEN 'approved' THEN
            v_title := 'Cập nhật ứng tuyển';
            v_message := 'Đơn ứng tuyển của bạn cho việc làm "' || COALESCE(v_job_title, '') || '" đã được chấp nhận';
        WHEN 'completed' THEN
            v_title := 'Hoàn thành ca làm';
            v_message := 'Bạn đã hoàn thành ca làm "' || COALESCE(v_job_title, '') || '". Cảm ơn bạn!';
        
        -- Absolutely NO notifications for rejected, working, no_show, or pending!
        WHEN 'rejected' THEN
            RETURN NEW;
        WHEN 'working' THEN
            RETURN NEW;
        WHEN 'no_show' THEN
            -- no_show is handled either by the cleanup_expired_jobs function directly or muted
            RETURN NEW;
        ELSE
            RETURN NEW;
    END CASE;

    -- Insert notification only if a valid message was constructed
    IF v_message IS NOT NULL AND v_title IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_id)
        VALUES (NEW.worker_id, v_title, v_message, 'application_update', NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the single status change trigger
CREATE TRIGGER on_application_status_change
    AFTER UPDATE OF status ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_application_status_change();
