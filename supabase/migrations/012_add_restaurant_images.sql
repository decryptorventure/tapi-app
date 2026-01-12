-- Migration: Add restaurant images and job thumbnails
-- Add columns for restaurant logo, cover photos, and job thumbnails

-- Add restaurant image columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS restaurant_logo_url TEXT,
ADD COLUMN IF NOT EXISTS restaurant_cover_urls TEXT[] DEFAULT '{}';

-- Add thumbnail column to jobs
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment descriptions
COMMENT ON COLUMN public.profiles.restaurant_logo_url IS 'URL to restaurant logo image';
COMMENT ON COLUMN public.profiles.restaurant_cover_urls IS 'Array of cover image URLs (max 5)';
COMMENT ON COLUMN public.jobs.thumbnail_url IS 'URL to job thumbnail image';
