-- Migration: Add work_experiences table for custom work history
-- Date: 2026-01-17
-- Description: Allows workers to add their own work experience separate from Tapy job history

-- Work Experiences Table
CREATE TABLE IF NOT EXISTS public.work_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- RLS Policies
CREATE POLICY "Users can view own work experiences"
  ON work_experiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work experiences"
  ON work_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work experiences"
  ON work_experiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work experiences"
  ON work_experiences FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public read for public profiles
CREATE POLICY "Work experiences are viewable by all authenticated users"
  ON work_experiences FOR SELECT
  USING (auth.role() = 'authenticated');

-- Update timestamp trigger
CREATE TRIGGER update_work_experiences_updated_at
  BEFORE UPDATE ON work_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE work_experiences IS 'Stores custom work experiences added by workers, separate from Tapy job history';
