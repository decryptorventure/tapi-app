-- Create Notifications Table
CREATE TYPE notification_type AS ENUM ('application_update', 'chat_message', 'system', 'reminder');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  related_id UUID, -- Can be job_id or application_id depending on context
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Chat Messages Table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE, -- Read by the recipient
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_chat_messages_application ON public.chat_messages(application_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at);

-- RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Chat Messages
CREATE POLICY "Users can view messages for their applications" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      WHERE ja.id = chat_messages.application_id
      AND (ja.worker_id = auth.uid() OR j.owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their applications" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      WHERE ja.id = chat_messages.application_id
      AND (ja.worker_id = auth.uid() OR j.owner_id = auth.uid())
    )
  );

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- TRIGGERS FOR NOTIFICATIONS

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

  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    v_owner_id,
    'Ứng viên mới',
    v_worker_name || ' đã ứng tuyển vào việc làm: ' || v_job_title,
    'application_update',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_application
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_application();


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
    'Đơn ứng tuyển của bạn cho việc làm ' || v_job_title || ' ' || v_status_text,
    'application_update',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_update
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_application_update();


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

  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    v_recipient_id,
    'Tin nhắn mới',
    'Bạn có tin nhắn mới từ ' || v_sender_name || ' về việc làm: ' || v_job_title,
    'chat_message',
    NEW.application_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_chat_message();
