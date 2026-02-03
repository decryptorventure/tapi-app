-- ============================================
-- MIGRATION: Time Modification Requests
-- Allow workers/owners to request time adjustments
-- Date: 2026-02-03
-- ============================================

-- 1. Create time_modification_requests table
CREATE TABLE IF NOT EXISTS public.time_modification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.profiles(id),
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('checkin', 'checkout', 'both')),
    
    -- Original times from checkins
    original_checkin_time TIMESTAMP WITH TIME ZONE,
    original_checkout_time TIMESTAMP WITH TIME ZONE,
    
    -- Proposed times
    proposed_checkin_time TIMESTAMP WITH TIME ZONE,
    proposed_checkout_time TIMESTAMP WITH TIME ZONE,
    
    reason TEXT NOT NULL,
    evidence_urls TEXT[], -- Photos/screenshots as evidence
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Auto-expire after 24 hours
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_tmr_application ON public.time_modification_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_tmr_requested_by ON public.time_modification_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_tmr_status ON public.time_modification_requests(status);
CREATE INDEX IF NOT EXISTS idx_tmr_expires ON public.time_modification_requests(expires_at);

-- 3. Enable RLS
ALTER TABLE public.time_modification_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Requesters can view their own requests
CREATE POLICY "Users can view own requests" ON public.time_modification_requests
  FOR SELECT USING (auth.uid() = requested_by);

-- Workers/Owners related to application can view
CREATE POLICY "Related parties can view requests" ON public.time_modification_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT worker_id FROM public.job_applications WHERE id = application_id
      UNION
      SELECT owner_id FROM public.jobs WHERE id = (
        SELECT job_id FROM public.job_applications WHERE id = application_id
      )
    )
  );

-- Users can create requests for their applications
CREATE POLICY "Users can create requests" ON public.time_modification_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requested_by AND
    auth.uid() IN (
      SELECT worker_id FROM public.job_applications WHERE id = application_id
      UNION
      SELECT owner_id FROM public.jobs WHERE id = (
        SELECT job_id FROM public.job_applications WHERE id = application_id
      )
    )
  );

-- Related party (not requester) can update status
CREATE POLICY "Counter party can review" ON public.time_modification_requests
  FOR UPDATE USING (
    auth.uid() != requested_by AND
    auth.uid() IN (
      SELECT worker_id FROM public.job_applications WHERE id = application_id
      UNION
      SELECT owner_id FROM public.jobs WHERE id = (
        SELECT job_id FROM public.job_applications WHERE id = application_id
      )
    )
  );

-- 5. Update trigger
CREATE TRIGGER update_tmr_updated_at 
  BEFORE UPDATE ON public.time_modification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Function to apply approved modifications
CREATE OR REPLACE FUNCTION apply_time_modification(p_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
  v_checkin_id UUID;
  v_checkout_id UUID;
BEGIN
  -- Get request details
  SELECT * INTO v_request
  FROM public.time_modification_requests
  WHERE id = p_request_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update checkin if proposed
  IF v_request.proposed_checkin_time IS NOT NULL THEN
    UPDATE public.checkins
    SET checkin_time = v_request.proposed_checkin_time,
        notes = COALESCE(notes, '') || ' [Modified: ' || v_request.reason || ']'
    WHERE application_id = v_request.application_id AND type = 'checkin';
  END IF;
  
  -- Update checkout if proposed
  IF v_request.proposed_checkout_time IS NOT NULL THEN
    UPDATE public.checkins
    SET checkin_time = v_request.proposed_checkout_time,
        notes = COALESCE(notes, '') || ' [Modified: ' || v_request.reason || ']'
    WHERE application_id = v_request.application_id AND type = 'checkout';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
