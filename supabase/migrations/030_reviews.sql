-- ============================================
-- MIGRATION: Two-Way Reviews
-- Workers and owners can rate each other
-- Date: 2026-02-03
-- ============================================

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id),
    
    -- Rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Predefined tags
    tags TEXT[],
    
    -- Optional comment
    comment TEXT,
    
    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One review per application per reviewer
    UNIQUE(application_id, reviewer_id)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_application ON public.reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- 3. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone can view public reviews
CREATE POLICY "Public reviews are viewable" ON public.reviews
  FOR SELECT USING (is_public = TRUE);

-- Users can view reviews they gave or received
CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() IN (reviewer_id, reviewee_id));

-- Users can create reviews for their completed applications
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    auth.uid() IN (
      SELECT worker_id FROM public.job_applications WHERE id = application_id AND status = 'completed'
      UNION
      SELECT owner_id FROM public.jobs WHERE id = (
        SELECT job_id FROM public.job_applications WHERE id = application_id AND status = 'completed'
      )
    )
  );

-- 5. Predefined review tags
COMMENT ON TABLE public.reviews IS 'Predefined tags:
Worker tags (by owner): punctual, hardworking, friendly, skilled, professional, communicative, reliable, fast_learner
Owner tags (by worker): clear_instructions, friendly, fair_payment, safe_workplace, organized, respectful, flexible, good_facilities';

-- 6. Update trigger
CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Function to update average rating after review
CREATE OR REPLACE FUNCTION update_reviewee_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating DECIMAL(2,1);
BEGIN
  -- Calculate new average rating
  SELECT ROUND(AVG(rating)::numeric, 1) INTO v_avg_rating
  FROM public.reviews
  WHERE reviewee_id = NEW.reviewee_id AND is_public = TRUE;
  
  -- Update profile
  UPDATE public.profiles
  SET average_rating = COALESCE(v_avg_rating, 0)
  WHERE id = NEW.reviewee_id;
  
  -- Recalculate grade if worker
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.reviewee_id AND role = 'worker') THEN
    PERFORM calculate_worker_grade(NEW.reviewee_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reviewee_rating ON public.reviews;
CREATE TRIGGER trg_update_reviewee_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviewee_rating();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
