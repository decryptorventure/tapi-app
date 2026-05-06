-- ============================================
-- MIGRATION: 008_fix_cleanup_and_notifications
-- Time-controlled check-in/check-out
-- Auto-close expired shifts after 15 min grace period
-- Proper notification trigger
-- Fix: RLS policies for checkins table
-- Fix: Add missing columns to checkins table
-- ============================================

-- 0a. Add missing columns to checkins table (production DB may not have them)
ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;

-- 0b. Fix RLS policies on checkins table
DROP POLICY IF EXISTS "Workers can checkin" ON public.checkins;
DROP POLICY IF EXISTS "Users can view relevant checkins" ON public.checkins;
DROP POLICY IF EXISTS "Workers can insert checkins" ON public.checkins;
DROP POLICY IF EXISTS "Workers can view own checkins" ON public.checkins;

-- Workers can insert checkin/checkout records for their own applications
CREATE POLICY "Workers can insert checkins" ON public.checkins
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT worker_id FROM public.job_applications WHERE id = application_id
        )
    );

-- Workers/Owners can view checkins for their applications/jobs
CREATE POLICY "Users can view checkins" ON public.checkins
    FOR SELECT USING (
        auth.uid() IN (
            SELECT worker_id FROM public.job_applications WHERE id = application_id
        )
        OR auth.uid() IN (
            SELECT j.owner_id FROM public.jobs j
            JOIN public.job_applications ja ON ja.job_id = j.id
            WHERE ja.id = application_id
        )
    );

-- 1. cleanup_expired_jobs: jobs + pending reject + auto-close shifts
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

    -- Step 1: Mark expired jobs
    UPDATE public.jobs
    SET status = 'expired', updated_at = NOW()
    WHERE (shift_date < current_vn_date OR (shift_date = current_vn_date AND shift_end_time::TIME < current_vn_time))
    AND status IN ('open', 'filled');

    -- Step 2: Auto-reject only 'pending' applications for expired jobs
    UPDATE public.job_applications
    SET status = 'rejected', updated_at = NOW()
    WHERE status = 'pending'
    AND job_id IN (SELECT id FROM public.jobs WHERE status = 'expired');

    -- Step 3: Auto-close 'approved' applications that missed check-in (past deadline = shift_start + 2h)
    UPDATE public.job_applications
    SET status = 'no_show', updated_at = NOW()
    WHERE status = 'approved'
    AND job_id IN (
        SELECT id FROM public.jobs
        WHERE shift_date = current_vn_date
        AND (shift_start_time::TIME + INTERVAL '2 hours') < current_vn_time
    )
    AND id NOT IN (
        SELECT DISTINCT application_id FROM public.checkins WHERE type = 'checkin'
    );

    -- Step 4: Auto-close 'working' applications where shift ended 15+ min ago (today)
    FOR app_record IN
        SELECT ja.id AS app_id, ja.worker_id, j.id AS job_id, j.title AS job_title,
               j.shift_end_time, j.shift_date
        FROM public.job_applications ja
        JOIN public.jobs j ON j.id = ja.job_id
        WHERE ja.status = 'working'
        AND j.shift_date = current_vn_date
        AND current_vn_time > (j.shift_end_time::TIME + INTERVAL '15 minutes')
    LOOP
        -- Only if checked in but NOT checked out
        IF EXISTS (
            SELECT 1 FROM public.checkins
            WHERE application_id = app_record.app_id AND type = 'checkin'
        ) AND NOT EXISTS (
            SELECT 1 FROM public.checkins
            WHERE application_id = app_record.app_id AND type = 'checkout'
        ) THEN
            -- Insert auto-checkout record
            INSERT INTO public.checkins (application_id, worker_id, job_id, type, checkin_time, is_valid, notes)
            VALUES (app_record.app_id, app_record.worker_id, app_record.job_id,
                    'checkout', NOW(), FALSE, 'Auto-closed: quá 15 phút sau ca');

            -- Mark as no_show
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

    -- Step 5: Auto-close working apps from PAST dates (forgot to checkout)
    FOR app_record IN
        SELECT ja.id AS app_id, ja.worker_id, j.id AS job_id, j.title AS job_title
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
            INSERT INTO public.checkins (application_id, worker_id, job_id, type, checkin_time, is_valid, notes)
            VALUES (app_record.app_id, app_record.worker_id, app_record.job_id,
                    'checkout', NOW(), FALSE, 'Auto-closed: ca hôm trước chưa checkout');

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

    -- Step 6: Auto-close 'approved' apps from past dates (never showed up)
    UPDATE public.job_applications
    SET status = 'no_show', updated_at = NOW()
    WHERE status IN ('approved', 'working')
    AND job_id IN (SELECT id FROM public.jobs WHERE shift_date < current_vn_date)
    AND id NOT IN (
        SELECT DISTINCT application_id FROM public.checkins WHERE type = 'checkin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop ALL old notification triggers
DROP TRIGGER IF EXISTS on_application_status_change ON public.job_applications;
DROP TRIGGER IF EXISTS on_application_update ON public.job_applications;
DROP TRIGGER IF EXISTS notify_application_update ON public.job_applications;
DROP TRIGGER IF EXISTS application_status_notification ON public.job_applications;
DROP TRIGGER IF EXISTS trigger_application_status ON public.job_applications;
DROP TRIGGER IF EXISTS on_application_status_update ON public.job_applications;

DROP FUNCTION IF EXISTS public.notify_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.on_application_status_update() CASCADE;

-- 3. Single notification trigger
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_job_title TEXT;
    v_message TEXT;
    v_title TEXT;
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    SELECT title INTO v_job_title FROM public.jobs WHERE id = NEW.job_id;

    CASE NEW.status
        WHEN 'approved' THEN
            v_title := 'Cập nhật ứng tuyển';
            v_message := 'Đơn ứng tuyển của bạn cho việc làm "' || COALESCE(v_job_title, '') || '" đã được chấp nhận';
        WHEN 'rejected' THEN
            v_title := 'Cập nhật ứng tuyển';
            v_message := 'Đơn ứng tuyển của bạn cho việc làm "' || COALESCE(v_job_title, '') || '" đã bị từ chối';
        WHEN 'completed' THEN
            v_title := 'Hoàn thành ca làm';
            v_message := 'Bạn đã hoàn thành ca làm "' || COALESCE(v_job_title, '') || '". Cảm ơn bạn!';
        WHEN 'working' THEN
            RETURN NEW;
        WHEN 'no_show' THEN
            -- no_show notifications handled inline by cleanup function to include context
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
