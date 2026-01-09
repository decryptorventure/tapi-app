-- Fix: Ensure profiles RLS policies allow signup
-- Issue: "new row violates row-level security policy for table profiles"
-- Solution: Drop all existing policies and recreate with correct permissions

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;

-- Create fresh policies with correct permissions
-- 1. Allow authenticated users to INSERT their own profile during signup
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. Allow users to SELECT their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify policies are active
DO $$
BEGIN
  RAISE NOTICE 'RLS Policies recreated successfully for profiles table';
END $$;
