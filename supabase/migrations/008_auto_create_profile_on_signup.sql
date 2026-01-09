-- Auto-create profile when user signs up
-- Issue: Manual profile insert fails due to RLS timing issues during signup
-- Solution: Database trigger creates profile automatically when auth user created

-- IMPORTANT: First ensure migration 006 (BEFORE trigger fix) is applied
-- This prevents infinite recursion when creating profile

-- Drop old AFTER trigger (from migration 003)
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;

-- Recreate as BEFORE trigger (prevents recursion)
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  -- Calculate completion (handles null values safely)
  new_completion := calculate_profile_completion(NEW.id);

  -- Modify NEW record directly (no UPDATE - no recursion)
  NEW.profile_completion_percentage := new_completion;
  NEW.can_apply := (NEW.role = 'worker' AND new_completion >= 80);
  NEW.can_post_jobs := (NEW.role = 'owner' AND new_completion >= 70);
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create BEFORE trigger (not AFTER)
CREATE TRIGGER trigger_update_profile_completion
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with minimal data
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table (runs when new user signs up)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Verify trigger created
DO $$
BEGIN
  RAISE NOTICE 'Auto-create profile trigger installed successfully';
END $$;
