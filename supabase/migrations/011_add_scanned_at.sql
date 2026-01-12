-- Migration: Add scanned_at column to checkins table
-- Purpose: Track one-time QR use to prevent double-scanning
-- Date: 2026-01-12

-- Add scanned_at column to track when QR was scanned
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookup of already-scanned check-ins
CREATE INDEX IF NOT EXISTS idx_checkins_scanned_at 
ON checkins(application_id, checkin_type) 
WHERE scanned_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN checkins.scanned_at IS 'Timestamp when QR code was scanned (for one-time use enforcement)';
