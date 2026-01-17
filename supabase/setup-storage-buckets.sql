-- Setup Storage Buckets for Tapy App
-- Run this in Supabase SQL Editor to ensure all buckets exist and are properly configured

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create verifications bucket (public for viewing uploaded ID cards)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verifications', 'verifications', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS Policies for avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS Policies for verifications bucket
CREATE POLICY "Anyone can view verifications" ON storage.objects
FOR SELECT USING (bucket_id = 'verifications');

CREATE POLICY "Authenticated users can upload verifications" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'verifications' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own verification files" ON storage.objects
FOR UPDATE USING (bucket_id = 'verifications' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "Users can delete own verification files" ON storage.objects
FOR DELETE USING (bucket_id = 'verifications' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Note: Run the following if you get "policy already exists" errors:
-- DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can view verifications" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload verifications" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update own verification files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete own verification files" ON storage.objects;
