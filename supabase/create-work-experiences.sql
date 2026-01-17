-- Quick setup for work_experiences table
-- Run this in Supabase SQL Editor

-- Drop existing table if needed (WARNING: this will delete existing data)
-- DROP TABLE IF EXISTS work_experiences CASCADE;

-- Create Work Experiences Table
CREATE TABLE IF NOT EXISTS public.work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_work_experiences_user_id ON work_experiences(user_id);

-- Enable RLS
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own work experiences" ON work_experiences;
DROP POLICY IF EXISTS "Users can insert own work experiences" ON work_experiences;
DROP POLICY IF EXISTS "Users can update own work experiences" ON work_experiences;
DROP POLICY IF EXISTS "Users can delete own work experiences" ON work_experiences;
DROP POLICY IF EXISTS "Work experiences are viewable by all authenticated users" ON work_experiences;
DROP POLICY IF EXISTS "Anyone can view work experiences" ON work_experiences;

-- RLS Policy: Allow anyone to view work experiences (for public profiles)
CREATE POLICY "Anyone can view work experiences"
  ON work_experiences FOR SELECT
  USING (true);

-- RLS Policy: Users can insert own work experiences
CREATE POLICY "Users can insert own work experiences"
  ON work_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update own work experiences
CREATE POLICY "Users can update own work experiences"
  ON work_experiences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete own work experiences
CREATE POLICY "Users can delete own work experiences"
  ON work_experiences FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access
GRANT ALL ON work_experiences TO authenticated;
GRANT SELECT ON work_experiences TO anon;
