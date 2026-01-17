-- Add favorite_workers table for owner to save preferred workers
CREATE TABLE IF NOT EXISTS public.favorite_workers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, worker_id)
);

-- Enable RLS
ALTER TABLE public.favorite_workers ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own favorites
CREATE POLICY "Owners can view their favorites"
    ON public.favorite_workers FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can add favorites"
    ON public.favorite_workers FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can remove favorites"
    ON public.favorite_workers FOR DELETE
    USING (auth.uid() = owner_id);

-- Create index for faster lookups
CREATE INDEX idx_favorite_workers_owner ON public.favorite_workers(owner_id);
CREATE INDEX idx_favorite_workers_worker ON public.favorite_workers(worker_id);
