-- ============================================
-- MIGRATION: 008_fix_cleanup_and_notifications
-- Fix: Time-controlled check-in/check-out
-- Fix: Auto-close expired shifts after 15 min grace period
-- Fix: Proper notification trigger
-- ============================================

-- 1. Fix cleanup_expired_jobs: includes auto-close of expired shifts
CREATE OR REPLACE FUNCTION public.cleanup_expired_jobs()
RETURNS void AS $$
DECLARE
    current_vn_date DATE;
    current_vn_time TIME;
    current_vn_ts TIMESTAMP;
    app_record RECORD;
BEGIN
    current_vn_ts := CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'ICT';
    current_vn_date := current_vn_ts::DATE;
    current_vn_time := current_vn_ts::TIME;

    -- Step 1: Update jobs to expired
    UPDATE public.jobs
    SET status = 'expired', updated_at = NOW()
    WHERE (shift_date < current_vn_date OR (shift_date = current_vn_date AND shift_end_time::TIME < current_vn_time))
    AND status IN ('open', 'filled');

    -- Step 2: Auto-reject ONLY 'pending' applications for expired jobs
    UPDATE public.job_applications
    SET status = 'rejected', updated_at = NOW()
    WHERE status = 'pending'
    AND job_id IN (SELECT id FROM public.jobs WHERE status = 'expired');

    -- Step 3: Auto-close 'working' applications where shift ended 15+ min ago
    -- Workers who checked in but didn't check out → mark as no_show
    FOR app_record IN
        SELECT ja.id AS app_id, ja.worker_id, j.title AS job_title, j.shift_end_time, j.shift_date
        FROM public.job_applications ja
        JOIN public.jobs j ON j.id = ja.job_id
        WHERE ja.status = 'working'
        AND j.shift_date = current_vn_date
        AND (j.shift_end_time::TIME + INTERVAL '15 minutes')::TIME < current_vn_time
    LOOP
        -- Check if this worker has checkin but no checkout
        IF EXISTS (
            SELECT 1 FROM public.checkins 
            WHERE application_id = app_record.app_id AND type = 'checkin'
        ) AND NOT EXISTS (
            SELECT 1 FROM public.checkins 
            WHERE application_id = app_record.app_id AND type = 'checkout'
        ) THEN
            -- Auto-insert checkout record
            INSERT INTO public.checkins (application_id, type, checkin_time, is_valid, notes)
            VALUES (app_record.app_id, 'checkout', NOW(), FALSE, 'Auto-closed: quá 15 phút sau ca');

            -- Mark as no_show (missed checkout)
            UPDATE public.job_applications
            SET status = 'no_show', updated_at = NOW()
            WHERE id = app_record.app_id;

            -- Notify worker
            INSERT INTO public.notifications (user_id, title, message, type, related_id)
            VALUES (
                app_record.worker_id,
                'Ca làm bị đóng',
                'Ca làm "' || COALESCE(app_record.job_title, '') || '" đã bị đóng tự động do quá giờ check-out 15 phút.',
                'application_update',
                app_record.app_id
            );
        END IF;
    END LOOP;

    -- Step 4: Also auto-close working apps from PAST dates (forgot to checkout yesterday)
    FOR app_record IN
        SELECT ja.id AS app_id, ja.worker_id, j.title AS job_title
        FROM public.job_applications ja
        JOIN public.jobs j ON j.id = ja.job_id
        WHERE ja.status = 'working'
        AND j.shift_date < current_vn_date
    LOOP
        IF EXISTS (
            SELECT 1 FROM public.checkins 
            WHERE application_id = app_record.app_id AND type = 'checkin'
        ) AND NOT EXISTS (
            SELECT 1 FROM public.checkins 
            WHERE application_id = app_record.app_id AND type = 'checkout'
        ) THEN
            INSERT INTO public.checkins (application_id, type, checkin_time, is_valid, notes)
            VALUES (app_record.app_id, 'checkout', NOW(), FALSE, 'Auto-closed: ca hôm trước chưa checkout');

            UPDATE public.job_applications
            SET status = 'no_show', updated_at = NOW()
            WHERE id = app_record.app_id;

            INSERT INTO public.notifications (user_id, title, message, type, related_id)
            VALUES (
                app_record.worker_id,
                'Ca làm bị đóng',
                'Ca làm "' || COALESCE(app_record.job_title, '') || '" đã bị đóng tự động do không check-out.',
                'application_update',
                app_record.app_id
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop ALL possible old notification triggers
DROP TRIGGER IF EXISTS on_application_status_change ON public.job_applications;
DROP TRIGGER IF EXISTS on_application_update ON public.job_applications;
DROP TRIGGER IF EXISTS notify_application_update ON public.job_applications;
DROP TRIGGER IF EXISTS application_status_notification ON public.job_applications;
DROP TRIGGER IF EXISTS trigger_application_status ON public.job_applications;
DROP TRIGGER IF EXISTS on_application_status_update ON public.job_applications;

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

    CASE NEW.status
        WHEN 'approved' THEN
            v_title := 'Cập nhật ứng tuyển';
            v_message := 'Đơn ứng tuyển của bạn cho việc làm ' || COALESCE(v_job_title, '') || ' đã được chấp nhận';
        WHEN 'rejected' THEN
            v_title := 'Cập nhật ứng tuyển';
            v_message := 'Đơn ứng tuyển của bạn cho việc làm ' || COALESCE(v_job_title, '') || ' đã bị từ chối';
        WHEN 'completed' THEN
            v_title := 'Hoàn thành ca làm';
            v_message := 'Bạn đã hoàn thành ca làm "' || COALESCE(v_job_title, '') || '". Cảm ơn bạn!';
        WHEN 'working' THEN
            -- Don't notify for working (check-in UI handles this)
            RETURN NEW;
        WHEN 'no_show' THEN
            -- no_show notifications are handled inline by cleanup function
            RETURN NEW;
        ELSE
            RETURN NEW;
    END CASE;

    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (NEW.worker_id, v_title, v_message, 'application_update', NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_status_change
    AFTER UPDATE OF status ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_application_status_change();
