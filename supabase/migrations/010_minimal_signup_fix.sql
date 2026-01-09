-- Minimal Signup Fix - Step by Step
-- Only includes essentials to make signup work

-- ============================================
-- STEP 1: Drop existing triggers to start fresh
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_language_skills_update_profile ON language_skills;
DROP TRIGGER IF EXISTS trigger_identity_verified ON identity_verifications;

-- ============================================
-- STEP 2: Create minimal profile completion function
-- ============================================

CREATE OR REPLACE FUNCTION calculate_profile_completion(target_user_id UUID)
RETURNS INT AS $$
BEGIN
  -- Return 0 for now - we'll enhance later
  -- This prevents errors during signup
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create simple BEFORE trigger (no recursion)
-- ============================================

CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Set safe defaults without calling calculate function
  NEW.profile_completion_percentage := 0;
  NEW.can_apply := FALSE;
  NEW.can_post_jobs := FALSE;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create BEFORE trigger
CREATE TRIGGER trigger_update_profile_completion
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();

-- ============================================
-- STEP 4: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with minimal data
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 5: Grant permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Minimal signup fix applied';
  RAISE NOTICE 'Signup should now work - profile completion will be enhanced later';
END $$;
