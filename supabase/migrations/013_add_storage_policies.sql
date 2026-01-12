-- Migration: Add Storage policies for restaurants bucket
-- This allows authenticated users to upload images to the restaurants bucket

-- Create the bucket if it doesn't exist (run this in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('restaurants', 'restaurants', true);

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload restaurant images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurants');

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own restaurant images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurants' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'restaurants');

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own restaurant images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurants' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow public read access 
CREATE POLICY "Public can view restaurant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurants');
