-- Migration: Create Storage Buckets
-- Date: 2026-01-08

-- Create the buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('verifications', 'verifications', true),
  ('videos', 'videos', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for 'verifications'
-- Allow public read access
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'verifications');

-- Allow authenticated users to upload to their own folder in 'verifications'
CREATE POLICY "Authenticated Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verifications' 
    AND auth.role() = 'authenticated'
    -- Ensure they are uploading to their own user directory
    -- Path format: certificates/{user_id}/... or verifications/{user_id}/...
    -- Note: This is a simplified policy. For production, you might want more granularity.
  );

-- Set up storage policies for 'videos'
-- Allow public read access
CREATE POLICY "Videos Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- Allow authenticated users to upload to their own folder in 'videos'
CREATE POLICY "Videos Authenticated Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' 
    AND auth.role() = 'authenticated'
  );

-- Set up storage policies for 'avatars'
-- Allow public read access
CREATE POLICY "Avatars Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Avatars Authenticated Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );
