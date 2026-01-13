-- FORCE CLEANUP AND FIX TRIGGERS
-- Run this in Supabase SQL Editor to verify the fix works.

-- 1. Drop existing triggers and functions to ensure clean slate
DROP TRIGGER IF EXISTS on_new_application ON public.job_applications;
DROP FUNCTION IF EXISTS public.handle_new_application();

DROP TRIGGER IF EXISTS on_application_update ON public.job_applications;
DROP FUNCTION IF EXISTS public.handle_application_update();

DROP TRIGGER IF EXISTS on_new_chat_message ON public.chat_messages;
DROP FUNCTION IF EXISTS public.handle_new_chat_message();

-- 2. Re-create robust functions

-- Function 1: New Application
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

  -- Verify owner_id was found
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

-- Function 2: Application Update
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
    WHEN 'completed' THEN 'đã hoàn thành'
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

-- Function 3: Chat Message
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
  -- Get IDs safely
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

-- 3. Re-create Triggers
CREATE TRIGGER on_new_application
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_application();

CREATE TRIGGER on_application_update
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_application_update();

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_chat_message();

-- 4. Re-apply Chat RLS policies (Just in case)
DROP POLICY IF EXISTS "Users can view messages for their applications" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their applications" ON public.chat_messages;

CREATE POLICY "Users can view messages for their applications" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      WHERE ja.id = chat_messages.application_id
      AND ja.worker_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      WHERE ja.id = chat_messages.application_id
      AND j.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their applications" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND (
      EXISTS (
        SELECT 1 FROM public.job_applications ja
        WHERE ja.id = chat_messages.application_id
        AND ja.worker_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.job_applications ja
        JOIN public.jobs j ON j.id = ja.job_id
        WHERE ja.id = chat_messages.application_id
        AND j.owner_id = auth.uid()
      )
    )
  );
