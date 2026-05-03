-- ============================================
-- SQUASHED MIGRATION: 006_safety_and_cleanup
-- Phase: Security & Automation
-- ============================================

-- 1. QR Code Management
CREATE TABLE IF NOT EXISTS public.job_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  qr_data TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  qr_type VARCHAR(20) DEFAULT 'static',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id)
);

-- Auto-generate QR when job is created
CREATE OR REPLACE FUNCTION auto_generate_job_qr()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.job_qr_codes (job_id, qr_data, secret_key)
  VALUES (
    NEW.id,
    json_build_object('job_id', NEW.id, 'owner_id', NEW.owner_id, 'created_at', NOW())::text,
    encode(gen_random_bytes(32), 'hex')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_job_qr_on_create ON public.jobs;
CREATE TRIGGER auto_generate_job_qr_on_create
  AFTER INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION auto_generate_job_qr();

-- 2. Expired Jobs Cleanup Function (LATEST VERSION)
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

    -- Auto-reject pending applications for expired jobs
    UPDATE public.job_applications
    SET status = 'rejected', updated_at = NOW()
    WHERE status IN ('pending', 'approved', 'working')
    AND job_id IN (SELECT id FROM public.jobs WHERE status = 'expired');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Security (RLS)
ALTER TABLE public.job_qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their job QR codes" ON public.job_qr_codes
  FOR ALL USING (auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = job_id));

CREATE POLICY "Workers can view QR for approved jobs" ON public.job_qr_codes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.job_applications ja WHERE ja.job_id = job_qr_codes.job_id AND ja.worker_id = auth.uid() AND ja.status = 'approved')
  );
