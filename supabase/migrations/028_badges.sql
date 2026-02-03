-- ============================================
-- MIGRATION: Badge System
-- Worker achievement and skill badges
-- Date: 2026-02-03
-- ============================================

-- 1. Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_vi VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description_vi TEXT,
    description_en TEXT,
    icon VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'achievement', 'skill', 'loyalty', 'special'
    criteria JSONB, -- Criteria for automatic awarding
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create worker_badges table (junction)
CREATE TABLE IF NOT EXISTS public.worker_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    related_job_id UUID REFERENCES public.jobs(id),
    UNIQUE(worker_id, badge_id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_badges_category ON public.badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_active ON public.badges(is_active);
CREATE INDEX IF NOT EXISTS idx_worker_badges_worker ON public.worker_badges(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_badges_badge ON public.worker_badges(badge_id);

-- 4. Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_badges ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Badges are public read
CREATE POLICY "Anyone can view badges" ON public.badges
  FOR SELECT USING (true);

-- Workers can view their own badges
CREATE POLICY "Workers can view own badges" ON public.worker_badges
  FOR SELECT USING (auth.uid() = worker_id);

-- Anyone can view worker badges (for profiles)
CREATE POLICY "Public can view worker badges" ON public.worker_badges
  FOR SELECT USING (true);

-- System inserts badges (via service role)
CREATE POLICY "Service can insert badges" ON public.worker_badges
  FOR INSERT WITH CHECK (true);

-- 6. Seed initial badges
INSERT INTO public.badges (code, name_vi, name_en, icon, category, description_vi, criteria, sort_order) VALUES
-- Achievement badges
('first_job', 'Khởi Đầu', 'First Timer', '🌟', 'achievement', 'Hoàn thành ca làm đầu tiên', '{"min_completed": 1}', 1),
('ten_jobs', 'Chăm Chỉ', 'Hard Worker', '💪', 'achievement', 'Hoàn thành 10 ca làm', '{"min_completed": 10}', 2),
('fifty_jobs', 'Kỳ Cựu', 'Veteran', '🎖️', 'achievement', 'Hoàn thành 50 ca làm', '{"min_completed": 50}', 3),
('hundred_jobs', 'Siêu Sao', 'Superstar', '🏆', 'achievement', 'Hoàn thành 100 ca làm', '{"min_completed": 100}', 4),

-- Punctuality badges
('punctual_5', 'Đúng Giờ', 'Punctual', '⏰', 'achievement', 'Check-in đúng giờ 5 lần liên tiếp', '{"consecutive_ontime": 5}', 10),
('punctual_20', 'Siêu Đúng Giờ', 'Super Punctual', '⏱️', 'achievement', 'Check-in đúng giờ 20 lần liên tiếp', '{"consecutive_ontime": 20}', 11),

-- Rating badges
('five_star_10', '5 Sao', 'Five Star', '⭐', 'achievement', 'Nhận 10 đánh giá 5 sao', '{"five_star_reviews": 10}', 20),
('five_star_50', 'Hoàn Hảo', 'Perfect', '🌟', 'achievement', 'Nhận 50 đánh giá 5 sao', '{"five_star_reviews": 50}', 21),

-- Time-based badges
('weekend_warrior', 'Chiến Binh Weekend', 'Weekend Warrior', '🗓️', 'achievement', 'Hoàn thành 10 ca cuối tuần', '{"weekend_jobs": 10}', 30),
('night_owl', 'Cú Đêm', 'Night Owl', '🦉', 'achievement', 'Hoàn thành 10 ca đêm (sau 20h)', '{"night_jobs": 10}', 31),
('early_bird', 'Chim Sớm', 'Early Bird', '🐦', 'achievement', 'Hoàn thành 10 ca sáng (trước 8h)', '{"morning_jobs": 10}', 32),

-- Skill badges (language)
('japanese_n2', 'Tiếng Nhật N2+', 'Japanese N2+', '🗾', 'skill', 'Chứng chỉ JLPT N2 trở lên', '{"language": "japanese", "min_level": "n2"}', 40),
('japanese_n1', 'Tiếng Nhật N1', 'Japanese N1', '🎌', 'skill', 'Chứng chỉ JLPT N1', '{"language": "japanese", "level": "n1"}', 41),
('korean_topik5', 'Tiếng Hàn TOPIK 5+', 'Korean TOPIK 5+', '🇰🇷', 'skill', 'Chứng chỉ TOPIK 5 trở lên', '{"language": "korean", "min_level": "topik_5"}', 42),

-- Loyalty badges
('loyal_5', 'Trung Thành', 'Loyal', '💎', 'loyalty', 'Hoàn thành 5 ca tại cùng 1 nhà hàng', '{"same_restaurant": 5}', 50),
('loyal_20', 'Siêu Trung Thành', 'Super Loyal', '👑', 'loyalty', 'Hoàn thành 20 ca tại cùng 1 nhà hàng', '{"same_restaurant": 20}', 51)

ON CONFLICT (code) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  description_vi = EXCLUDED.description_vi,
  criteria = EXCLUDED.criteria;

-- 7. Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_worker_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_completed INTEGER;
  v_badges_awarded INTEGER := 0;
  badge_record RECORD;
BEGIN
  -- Get completed jobs count
  SELECT total_completed_jobs INTO v_completed
  FROM public.profiles
  WHERE id = p_worker_id;
  
  -- Check completion badges
  FOR badge_record IN 
    SELECT id, code, criteria FROM public.badges 
    WHERE category = 'achievement' 
    AND criteria->>'min_completed' IS NOT NULL
    AND is_active = TRUE
  LOOP
    IF v_completed >= (badge_record.criteria->>'min_completed')::INTEGER THEN
      INSERT INTO public.worker_badges (worker_id, badge_id)
      VALUES (p_worker_id, badge_record.id)
      ON CONFLICT DO NOTHING;
      
      IF FOUND THEN
        v_badges_awarded := v_badges_awarded + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_badges_awarded;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
