-- ============================================
-- MIGRATION: QR Check-in Flow Reversal
-- Owner generates QR → Worker scans
-- Date: 2026-01-15
-- ============================================

-- 1. Create job_qr_codes table
CREATE TABLE IF NOT EXISTS public.job_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  qr_data TEXT NOT NULL, -- JSON data for QR
  secret_key TEXT NOT NULL, -- For validation
  qr_type VARCHAR(20) DEFAULT 'static', -- 'static' | 'dynamic'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id)
);

-- 2. Add columns to checkins table
ALTER TABLE public.checkins 
  ADD COLUMN IF NOT EXISTS qr_code_id UUID REFERENCES public.job_qr_codes(id),
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP WITH TIME ZONE;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_qr_codes_job ON public.job_qr_codes(job_id);
CREATE INDEX IF NOT EXISTS idx_job_qr_codes_active ON public.job_qr_codes(is_active);

-- 4. Enable RLS
ALTER TABLE public.job_qr_codes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for job_qr_codes

-- Owners can manage their own job QR codes
CREATE POLICY "Owners can manage their job QR codes" ON public.job_qr_codes
  FOR ALL USING (
    auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = job_id)
  );

-- Workers can view QR codes for jobs they've applied to (approved status)
CREATE POLICY "Workers can view QR for approved jobs" ON public.job_qr_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_applications
      WHERE job_applications.job_id = job_qr_codes.job_id
        AND job_applications.worker_id = auth.uid()
        AND job_applications.status = 'approved'
    )
  );

-- 6. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_job_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_qr_codes_updated_at
  BEFORE UPDATE ON public.job_qr_codes
  FOR EACH ROW EXECUTE FUNCTION update_job_qr_codes_updated_at();

-- 7. Function to auto-generate QR when job is created
CREATE OR REPLACE FUNCTION auto_generate_job_qr()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.job_qr_codes (job_id, qr_data, secret_key)
  VALUES (
    NEW.id,
    json_build_object(
      'job_id', NEW.id,
      'owner_id', NEW.owner_id,
      'created_at', NOW()
    )::text,
    encode(gen_random_bytes(32), 'hex')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_job_qr_on_create
  AFTER INSERT ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION auto_generate_job_qr();

-- ============================================
-- MIGRATION COMPLETE
-- Run verification:
-- SELECT * FROM public.job_qr_codes LIMIT 10;
-- ============================================
