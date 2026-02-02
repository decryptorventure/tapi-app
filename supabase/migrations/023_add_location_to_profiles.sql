-- Add geolocation columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS restaurant_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS restaurant_lng DOUBLE PRECISION;

-- Add index for geospatial queries (future proofing)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles (restaurant_lat, restaurant_lng);
