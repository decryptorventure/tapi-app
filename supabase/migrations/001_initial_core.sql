-- ============================================
-- SQUASHED MIGRATION: 001_initial_core
-- Phase: Foundation, Auth & Security
-- ============================================

-- 1. Initial Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('worker', 'owner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE language_type AS ENUM ('japanese', 'korean', 'english');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE language_level AS ENUM ('beginner', 'n5', 'n4', 'n3', 'n2', 'n1', 'topik_1', 'topik_2', 'topik_3', 'topik_4', 'topik_5', 'topik_6', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'worker',
    phone_number VARCHAR(20) UNIQUE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    university_name VARCHAR(255),
    date_of_birth DATE,
    bio TEXT,
    reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_account_frozen BOOLEAN DEFAULT FALSE,
    frozen_until TIMESTAMP WITH TIME ZONE,
    profile_completion_percentage INTEGER DEFAULT 0,
    can_apply BOOLEAN DEFAULT FALSE,
    can_post_jobs BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restaurant_name VARCHAR(255),
    restaurant_address TEXT,
    restaurant_lat DECIMAL(10, 8),
    restaurant_lng DECIMAL(11, 8),
    restaurant_logo_url TEXT,
    restaurant_cover_urls TEXT[],
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Verification Tables
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

-- 5. Basic Triggers & Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. New User Handler (Minimal & Reliable)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'worker'::user_role)
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Ensure auth signup never fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (TRUE);
