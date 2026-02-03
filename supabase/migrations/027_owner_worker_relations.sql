-- ============================================
-- MIGRATION: Owner-Worker Relations (Block/Favorite)
-- CRM features for owners to manage worker relationships
-- Date: 2026-02-03
-- ============================================

-- 1. Create owner_worker_relations table
CREATE TABLE IF NOT EXISTS public.owner_worker_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relation_type VARCHAR(20) NOT NULL CHECK (relation_type IN ('block', 'favorite')),
    reason TEXT,
    related_job_id UUID REFERENCES public.jobs(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, worker_id)
);

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_owr_owner ON public.owner_worker_relations(owner_id);
CREATE INDEX IF NOT EXISTS idx_owr_worker ON public.owner_worker_relations(worker_id);
CREATE INDEX IF NOT EXISTS idx_owr_type ON public.owner_worker_relations(relation_type);

-- 3. Enable RLS
ALTER TABLE public.owner_worker_relations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Owners can view their own relations
CREATE POLICY "Owners can view own relations" ON public.owner_worker_relations
  FOR SELECT USING (auth.uid() = owner_id);

-- Owners can create relations
CREATE POLICY "Owners can create relations" ON public.owner_worker_relations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own relations
CREATE POLICY "Owners can update own relations" ON public.owner_worker_relations
  FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete their own relations
CREATE POLICY "Owners can delete own relations" ON public.owner_worker_relations
  FOR DELETE USING (auth.uid() = owner_id);

-- Workers can see if they are blocked (for filtering)
CREATE POLICY "Workers can view blocks on them" ON public.owner_worker_relations
  FOR SELECT USING (auth.uid() = worker_id AND relation_type = 'block');

-- 5. Function to check if worker is blocked by owner
CREATE OR REPLACE FUNCTION is_worker_blocked(p_owner_id UUID, p_worker_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.owner_worker_relations
    WHERE owner_id = p_owner_id 
      AND worker_id = p_worker_id 
      AND relation_type = 'block'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get owners who blocked a worker
CREATE OR REPLACE FUNCTION get_blocking_owners(p_worker_id UUID)
RETURNS UUID[] AS $$
DECLARE
  result UUID[];
BEGIN
  SELECT ARRAY_AGG(owner_id) INTO result
  FROM public.owner_worker_relations
  WHERE worker_id = p_worker_id AND relation_type = 'block';
  
  RETURN COALESCE(result, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to get favorite workers for an owner
CREATE OR REPLACE FUNCTION get_favorite_workers(p_owner_id UUID)
RETURNS UUID[] AS $$
DECLARE
  result UUID[];
BEGIN
  SELECT ARRAY_AGG(worker_id) INTO result
  FROM public.owner_worker_relations
  WHERE owner_id = p_owner_id AND relation_type = 'favorite';
  
  RETURN COALESCE(result, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update trigger for updated_at
CREATE TRIGGER update_owr_updated_at 
  BEFORE UPDATE ON public.owner_worker_relations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
