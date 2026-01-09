-- Migration: Fix profiles table RLS and make fields nullable for flexible onboarding
-- Date: 2026-01-08

-- Allow fields to be NULL initially to support different signup/onboarding flows
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- Add INSERT policy for profiles (Allows signup profile creation)
-- Using DROP/CREATE to ensure it's up to date
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix language_skills policy to include WITH CHECK for inserts
DROP POLICY IF EXISTS "Users can manage their own language skills" ON public.language_skills;
CREATE POLICY "Users can manage their own language skills" ON public.language_skills
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ensure profiles are viewable by self
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Ensure profiles can be updated by self
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
