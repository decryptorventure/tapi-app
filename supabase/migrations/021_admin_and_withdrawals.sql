-- Migration: Add is_admin column and improve admin functionality
-- Date: 2026-01-28

-- 1. Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Set existing admin users (by email)
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email IN ('admin@tapi.vn', 'tommy@example.com');

-- 3. Create index for admin lookup
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;

-- 4. Add withdrawal_requests table for manual payment tracking
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_vnd INTEGER NOT NULL CHECK (amount_vnd >= 50000),
  payment_method VARCHAR(50) NOT NULL, -- 'momo', 'zalopay', 'bank_transfer'
  payment_info JSONB NOT NULL, -- phone number or bank details
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create index for withdrawal requests
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- 6. Enable RLS for withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies - admins can view and update all withdrawal requests
CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update withdrawal requests" ON public.withdrawal_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- 8. Update trigger for withdrawal_requests
CREATE TRIGGER update_withdrawal_requests_updated_at 
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Ensure business_verifications table exists
CREATE TABLE IF NOT EXISTS public.business_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_url TEXT NOT NULL,
  license_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for business_verifications
ALTER TABLE public.business_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own verification" ON public.business_verifications
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own verification" ON public.business_verifications
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can view all verifications" ON public.business_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update verifications" ON public.business_verifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
