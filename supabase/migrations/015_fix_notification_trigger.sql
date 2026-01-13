-- FIX: Update triggers to handle potential NULL values safely using COALESCE
-- This prevents "null value in column message violates not-null constraint"

-- 1. Notify Owner on New Application
CREATE OR REPLACE FUNCTION public.handle_new_application()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_job_title TEXT;
  v_worker_name TEXT;
BEGIN
  -- Get job details and owner
  SELECT owner_id, title INTO v_owner_id, v_job_title
  FROM public.jobs
  WHERE id = NEW.job_id;

  -- Get worker name
  SELECT full_name INTO v_worker_name
  FROM public.profiles
  WHERE id = NEW.worker_id;

  -- Verify owner_id was found (job exists)
  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      v_owner_id,
      'Ứng viên mới',
      COALESCE(v_worker_name, 'Ứng viên') || ' đã ứng tuyển vào việc làm: ' || COALESCE(v_job_title, 'Công việc'),
      'application_update',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Notify Worker on Application Status Change
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

  -- Map status to friendly text
  v_status_text := CASE NEW.status
    WHEN 'approved' THEN 'đã được chấp nhận'
    WHEN 'rejected' THEN 'đã bị từ chối'
    WHEN 'cancelled' THEN 'đã bị hủy'
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


-- 3. Notify Recipient on New Chat Message
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  v_worker_id UUID;
  v_owner_id UUID;
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_job_title TEXT;
  v_job_id UUID;
BEGIN
  -- Get IDs
  SELECT ja.worker_id, j.owner_id, j.title, j.id
  INTO v_worker_id, v_owner_id, v_job_title, v_job_id
  FROM public.job_applications ja
  JOIN public.jobs j ON j.id = ja.job_id
  WHERE ja.id = NEW.application_id;

  -- Determine recipient
  IF NEW.sender_id = v_worker_id THEN
    v_recipient_id := v_owner_id;
  ELSE
    v_recipient_id := v_worker_id;
  END IF;

  -- Get sender name
  SELECT full_name INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Only insert if we found a recipient
  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      v_recipient_id,
      'Tin nhắn mới',
      'Bạn có tin nhắn mới từ ' || COALESCE(v_sender_name, 'Người dùng') || ' về việc làm: ' || COALESCE(v_job_title, 'Công việc'),
      'chat_message',
      NEW.application_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
