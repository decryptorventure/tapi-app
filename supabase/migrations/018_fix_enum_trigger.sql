-- FIX: Remove 'cancelled' from trigger CASE statement
-- The application_status enum doesn't have 'cancelled' as a valid value

CREATE OR REPLACE FUNCTION public.handle_application_update()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_status_text TEXT;
BEGIN
  -- Only run if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get job title
  SELECT title INTO v_job_title
  FROM public.jobs
  WHERE id = NEW.job_id;

  -- Map status to friendly text (only using VALID enum values)
  -- Cast to text to avoid enum comparison issues
  v_status_text := CASE NEW.status::text
    WHEN 'approved' THEN 'đã được chấp nhận'
    WHEN 'rejected' THEN 'đã bị từ chối'
    WHEN 'completed' THEN 'đã hoàn thành'
    WHEN 'no_show' THEN 'đã bị đánh dấu vắng mặt'
    ELSE 'đã cập nhật trạng thái'
  END;

  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    NEW.worker_id,
    'Cập nhật ứng tuyển',
    'Đơn ứng tuyển của bạn cho việc làm ' || COALESCE(v_job_title, 'Công việc') || ' ' || v_status_text,
    'application_update',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
