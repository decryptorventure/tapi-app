-- ============================================
-- SQUASHED MIGRATION: 003_notifications_and_messaging
-- Phase: Communication & Engagement
-- ============================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chat System
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notification Triggers (Consolidated from 017)
CREATE OR REPLACE FUNCTION public.handle_new_application()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_job_title TEXT;
  v_worker_name TEXT;
BEGIN
  SELECT owner_id, title INTO v_owner_id, v_job_title FROM public.jobs WHERE id = NEW.job_id;
  SELECT full_name INTO v_worker_name FROM public.profiles WHERE id = NEW.worker_id;

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (v_owner_id, 'Ứng viên mới', COALESCE(v_worker_name, 'Ứng viên') || ' đã ứng tuyển vào: ' || v_job_title, 'application_update', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_application AFTER INSERT ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_application();

-- 4. Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "View chat messages" ON public.chat_messages FOR SELECT USING (
    auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.job_applications ja WHERE ja.id = application_id AND (ja.worker_id = auth.uid() OR auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = ja.job_id)))
);

CREATE POLICY "Send chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
