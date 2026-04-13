-- ============================================
-- SQUASHED MIGRATION: 002_jobs_and_applications
-- Phase: Job Lifecycle & Worker Flow
-- ============================================

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('open', 'filled', 'completed', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected', 'working', 'completed', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE checkin_type AS ENUM ('checkin', 'checkout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
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
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status application_status DEFAULT 'pending',
    is_instant_book BOOLEAN DEFAULT FALSE,
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_1h_sent BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancellation_reason TEXT,
    cancellation_penalty INTEGER DEFAULT 0,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, worker_id)
);

-- 4. Check-ins Table
CREATE TABLE IF NOT EXISTS public.checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    type checkin_type NOT NULL,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scanned_at TIMESTAMP WITH TIME ZONE,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    is_valid BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- 5. Work Experiences Table
CREATE TABLE IF NOT EXISTS public.work_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    position TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_owner ON public.jobs(owner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON public.jobs(shift_date);
CREATE INDEX IF NOT EXISTS idx_applications_worker ON public.job_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.job_applications(job_id);

-- 7. Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs are viewable by all" ON public.jobs FOR SELECT USING (TRUE);
CREATE POLICY "Owners can manage jobs" ON public.jobs FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Workers can manage own applications" ON public.job_applications FOR ALL USING (auth.uid() = worker_id);
CREATE POLICY "Owners can view applications for their jobs" ON public.job_applications FOR SELECT USING (
    auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = job_id)
);

CREATE POLICY "Workers can checkin" ON public.checkins FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Users can view relevant checkins" ON public.checkins FOR SELECT USING (
    auth.uid() = worker_id OR auth.uid() = (SELECT owner_id FROM public.jobs WHERE id = job_id)
);
