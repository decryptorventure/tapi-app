-- Migration: Add verification tables for identity and business documents
-- Date: 2026-01-07
-- Phase: 1 - Foundation

-- Identity Verifications Table
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  id_number TEXT,
  issue_date DATE,
  status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Verifications Table
CREATE TABLE IF NOT EXISTS public.business_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_url TEXT NOT NULL,
  license_number TEXT NOT NULL,
  status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_business_verifications_owner_id ON business_verifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_verifications_status ON business_verifications(status);

-- Enable RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Identity Verifications
CREATE POLICY "Users can view own identity verifications"
  ON identity_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity verifications"
  ON identity_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Business Verifications
CREATE POLICY "Owners can view own business verifications"
  ON business_verifications FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own business verifications"
  ON business_verifications FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Comments for documentation
COMMENT ON TABLE identity_verifications IS 'Stores worker identity verification documents (ID card, passport)';
COMMENT ON TABLE business_verifications IS 'Stores owner business license documents for restaurant verification';
