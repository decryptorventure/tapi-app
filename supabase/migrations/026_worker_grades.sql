-- ============================================
-- MIGRATION: Worker Grades System
-- Certified Worker levels based on performance
-- Date: 2026-02-03
-- ============================================

-- 1. Add grade-related columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS worker_grade VARCHAR(20) DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS total_completed_jobs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS grade_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS consecutive_no_penalty_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_penalty_at TIMESTAMP WITH TIME ZONE;

-- 2. Add constraint for valid grades
ALTER TABLE public.profiles 
  ADD CONSTRAINT check_worker_grade 
  CHECK (worker_grade IN ('bronze', 'silver', 'gold', 'platinum'));

-- 3. Create index for grade-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_worker_grade ON public.profiles(worker_grade);
CREATE INDEX IF NOT EXISTS idx_profiles_total_completed ON public.profiles(total_completed_jobs);

-- 4. Function to calculate and update worker grade
CREATE OR REPLACE FUNCTION calculate_worker_grade(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_completed INTEGER;
  v_rating DECIMAL(2,1);
  v_no_penalty_days INTEGER;
  v_no_show_count INTEGER;
  v_new_grade VARCHAR(20);
  v_current_grade VARCHAR(20);
BEGIN
  -- Get current stats
  SELECT 
    total_completed_jobs,
    average_rating,
    consecutive_no_penalty_days,
    worker_grade
  INTO v_completed, v_rating, v_no_penalty_days, v_current_grade
  FROM public.profiles
  WHERE id = p_user_id AND role = 'worker';
  
  IF NOT FOUND THEN
    RETURN 'bronze';
  END IF;
  
  -- Count total no-shows
  SELECT COUNT(*) INTO v_no_show_count
  FROM public.reliability_history
  WHERE user_id = p_user_id AND reason = 'no_show';
  
  -- Calculate grade based on criteria
  -- Platinum: 100+ jobs, rating >= 4.8, 0 no-shows ever
  IF v_completed >= 100 AND v_rating >= 4.8 AND v_no_show_count = 0 THEN
    v_new_grade := 'platinum';
  -- Gold: 30+ jobs, rating >= 4.5, no penalty in 30 days
  ELSIF v_completed >= 30 AND v_rating >= 4.5 AND v_no_penalty_days >= 30 THEN
    v_new_grade := 'gold';
  -- Silver: 10+ jobs, rating >= 4.0
  ELSIF v_completed >= 10 AND v_rating >= 4.0 THEN
    v_new_grade := 'silver';
  ELSE
    v_new_grade := 'bronze';
  END IF;
  
  -- Update if grade changed
  IF v_new_grade != v_current_grade THEN
    UPDATE public.profiles
    SET worker_grade = v_new_grade, grade_updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
  
  RETURN v_new_grade;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to update completed jobs count and average rating
CREATE OR REPLACE FUNCTION update_worker_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_completed INTEGER;
  v_avg_rating DECIMAL(2,1);
BEGIN
  -- Count completed jobs
  SELECT COUNT(*) INTO v_completed
  FROM public.job_applications
  WHERE worker_id = p_user_id AND status = 'completed';
  
  -- Calculate average rating (from future reviews table, default to 5.0 for now)
  -- Will be updated when reviews table is implemented
  v_avg_rating := 5.0;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    total_completed_jobs = v_completed,
    average_rating = v_avg_rating
  WHERE id = p_user_id;
  
  -- Recalculate grade
  PERFORM calculate_worker_grade(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to update stats when job is completed
CREATE OR REPLACE FUNCTION trigger_update_worker_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM update_worker_stats(NEW.worker_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_worker_stats ON public.job_applications;
CREATE TRIGGER trg_update_worker_stats
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_worker_stats();

-- 7. Initialize existing workers' stats
DO $$
DECLARE
  worker_record RECORD;
BEGIN
  FOR worker_record IN 
    SELECT id FROM public.profiles WHERE role = 'worker'
  LOOP
    PERFORM update_worker_stats(worker_record.id);
  END LOOP;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
