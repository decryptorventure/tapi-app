-- ============================================
-- MIGRATION: 009_update_cleanup_rules
-- Fix: Extend auto-close and expire rules from 15 mins to 2 hours
-- ============================================

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

    -- Step 1: Mark expired jobs (2 hours after shift end)
    UPDATE public.jobs
    SET status = 'expired', updated_at = NOW()
    WHERE (shift_date < current_vn_date OR (shift_date = current_vn_date AND (shift_end_time::TIME + INTERVAL '2 hours') < current_vn_time))
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

    -- Step 4: Auto-close 'working' applications where shift ended 2+ hours ago (today)
    FOR app_record IN
        SELECT ja.id AS app_id, ja.worker_id, j.id AS job_id, j.title AS job_title,
               j.shift_end_time, j.shift_date
        FROM public.job_applications ja
        JOIN public.jobs j ON j.id = ja.job_id
        WHERE ja.status = 'working'
        AND j.shift_date = current_vn_date
        AND current_vn_time > (j.shift_end_time::TIME + INTERVAL '2 hours')
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
                    'checkout', NOW(), FALSE, 'Auto-closed: quá 2 tiếng sau ca');

            -- Mark as no_show
            UPDATE public.job_applications
            SET status = 'no_show', updated_at = NOW()
            WHERE id = app_record.app_id;

            -- Notify worker
            INSERT INTO public.notifications (user_id, title, message, type, related_id)
            VALUES (
                app_record.worker_id,
                'Ca làm bị đóng',
                'Ca làm "' || COALESCE(app_record.job_title, '') || '" đã bị đóng tự động do quá giờ check-out 2 tiếng.',
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
