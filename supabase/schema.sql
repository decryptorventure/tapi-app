-- Tapy Database Schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('worker', 'owner');
CREATE TYPE language_type AS ENUM ('japanese', 'korean', 'english');
CREATE TYPE language_level AS ENUM ('beginner', 'n5', 'n4', 'n3', 'n2', 'n1', 'topik_1', 'topik_2', 'topik_3', 'topik_4', 'topik_5', 'topik_6', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE job_status AS ENUM ('open', 'filled', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'no_show');
CREATE TYPE checkin_type AS ENUM ('checkin', 'checkout');

-- Users Table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Worker specific fields
  university_name VARCHAR(255),
  date_of_birth DATE,
  bio TEXT,
  reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  is_verified BOOLEAN DEFAULT FALSE,
  is_account_frozen BOOLEAN DEFAULT FALSE,
  frozen_until TIMESTAMP WITH TIME ZONE,
  intro_video_url TEXT,
  
  -- Owner specific fields
  restaurant_name VARCHAR(255),
  restaurant_address TEXT,
  restaurant_lat DECIMAL(10, 8),
  restaurant_lng DECIMAL(11, 8),
  cuisine_type VARCHAR(50), -- 'japanese' or 'korean'
  business_license_number VARCHAR(100)
);

-- Language Skills Table
CREATE TABLE public.language_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language language_type NOT NULL,
  level language_level NOT NULL,
  verification_status verification_status DEFAULT 'pending',
  certificate_url TEXT,
  quiz_score INTEGER, -- 0-100
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language)
);

-- Jobs/Shifts Table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  shift_date DATE NOT NULL,
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  hourly_rate_vnd INTEGER NOT NULL CHECK (hourly_rate_vnd > 0),
  required_language language_type NOT NULL,
  required_language_level language_level NOT NULL,
  min_reliability_score INTEGER DEFAULT 90 CHECK (min_reliability_score >= 0 AND min_reliability_score <= 100),
  dress_code TEXT,
  max_workers INTEGER DEFAULT 1,
  current_workers INTEGER DEFAULT 0,
  status job_status DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  is_instant_book BOOLEAN DEFAULT FALSE, -- true if worker met all criteria
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  checkin_qr_code TEXT, -- Generated QR code for this shift
  checkin_qr_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, worker_id)
);

-- Check-in/Check-out Records
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  type checkin_type NOT NULL,
  checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_from_restaurant_meters DECIMAL(10, 2),
  is_valid BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- Reliability Score History (Audit Trail)
CREATE TABLE public.reliability_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_change INTEGER NOT NULL, -- can be negative
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL, -- 'late_checkin', 'no_show', 'completion', etc.
  related_job_id UUID REFERENCES public.jobs(id),
  related_application_id UUID REFERENCES public.job_applications(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet/Transactions Table (Mock for future integration)
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id),
  application_id UUID REFERENCES public.job_applications(id),
  amount_vnd INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'earning', 'payout', 'penalty'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_method VARCHAR(50), -- 'momo', 'zalopay', 'bank_transfer'
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX idx_profiles_reliability ON public.profiles(reliability_score);
CREATE INDEX idx_language_skills_user ON public.language_skills(user_id);
CREATE INDEX idx_language_skills_status ON public.language_skills(verification_status);
CREATE INDEX idx_jobs_owner ON public.jobs(owner_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_date ON public.jobs(shift_date);
CREATE INDEX idx_jobs_language ON public.jobs(required_language, required_language_level);
CREATE INDEX idx_applications_worker ON public.job_applications(worker_id);
CREATE INDEX idx_applications_job ON public.job_applications(job_id);
CREATE INDEX idx_applications_status ON public.job_applications(status);
CREATE INDEX idx_checkins_application ON public.checkins(application_id);
CREATE INDEX idx_reliability_history_user ON public.reliability_history(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reliability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Workers can view owner profiles" ON public.profiles
  FOR SELECT USING (role = 'owner');

CREATE POLICY "Owners can view worker profiles" ON public.profiles
  FOR SELECT USING (role = 'worker');

-- Language Skills Policies
CREATE POLICY "Users can manage their own language skills" ON public.language_skills
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Language skills are viewable by all authenticated users" ON public.language_skills
  FOR SELECT USING (auth.role() = 'authenticated');

-- Jobs Policies
CREATE POLICY "Owners can create their own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can manage their own jobs" ON public.jobs
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Workers can view open jobs" ON public.jobs
  FOR SELECT USING (status = 'open' AND auth.role() = 'authenticated');

-- Job Applications Policies
CREATE POLICY "Workers can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Users can view their own applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = worker_id OR auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = job_id));

CREATE POLICY "Owners can update applications for their jobs" ON public.job_applications
  FOR UPDATE USING (auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = job_id));

-- Checkins Policies
CREATE POLICY "Users can view checkins for their applications" ON public.checkins
  FOR SELECT USING (
    auth.uid() = (SELECT worker_id FROM public.job_applications WHERE id = application_id)
    OR auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = (SELECT job_id FROM public.job_applications WHERE id = application_id))
  );

CREATE POLICY "Workers can create checkins" ON public.checkins
  FOR INSERT WITH CHECK (auth.uid() = (SELECT worker_id FROM public.job_applications WHERE id = application_id));

-- Wallet Transactions Policies
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Functions and Triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update reliability score
CREATE OR REPLACE FUNCTION update_reliability_score(
  p_user_id UUID,
  p_score_change INTEGER,
  p_reason VARCHAR(255),
  p_job_id UUID DEFAULT NULL,
  p_application_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_previous_score INTEGER;
  v_new_score INTEGER;
BEGIN
  SELECT reliability_score INTO v_previous_score
  FROM public.profiles
  WHERE id = p_user_id;
  
  v_new_score := GREATEST(0, LEAST(100, v_previous_score + p_score_change));
  
  UPDATE public.profiles
  SET reliability_score = v_new_score
  WHERE id = p_user_id;
  
  INSERT INTO public.reliability_history (
    user_id, score_change, previous_score, new_score, reason, related_job_id, related_application_id
  ) VALUES (
    p_user_id, p_score_change, v_previous_score, v_new_score, p_reason, p_job_id, p_application_id
  );
  
  -- Freeze account if score drops too low or no-show occurred
  IF p_reason = 'no_show' THEN
    UPDATE public.profiles
    SET is_account_frozen = TRUE, frozen_until = NOW() + INTERVAL '7 days'
    WHERE id = p_user_id;
  END IF;
  
  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql;

