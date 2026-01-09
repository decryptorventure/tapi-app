-- Migration: Profile completion calculation function and triggers
-- Date: 2026-01-07
-- Phase: 1 - Foundation

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(target_user_id UUID)
RETURNS INT AS $$
DECLARE
  completion INT := 0;
  user_profile profiles%ROWTYPE;
  has_language BOOLEAN;
  has_identity BOOLEAN;
  has_business BOOLEAN;
BEGIN
  -- Get profile
  SELECT * INTO user_profile FROM profiles WHERE id = target_user_id;

  IF user_profile.id IS NULL THEN
    RETURN 0;
  END IF;

  -- Basic info (20%)
  IF user_profile.full_name IS NOT NULL AND user_profile.phone_number IS NOT NULL THEN
    completion := completion + 20;
  END IF;

  -- Role selected (10%)
  IF user_profile.role IS NOT NULL THEN
    completion := completion + 10;
  END IF;

  -- Worker-specific (70%)
  IF user_profile.role = 'worker' THEN
    -- Date of birth (10%)
    IF user_profile.date_of_birth IS NOT NULL THEN
      completion := completion + 10;
    END IF;

    -- Verified language skill (30%)
    SELECT EXISTS (
      SELECT 1 FROM language_skills
      WHERE user_id = target_user_id
      AND verification_status = 'verified'
    ) INTO has_language;

    IF has_language THEN
      completion := completion + 30;
    END IF;

    -- Identity verified (30%)
    IF user_profile.is_verified = TRUE THEN
      completion := completion + 30;
    END IF;
  END IF;

  -- Owner-specific (70%)
  IF user_profile.role = 'owner' THEN
    -- Restaurant info (30%)
    IF user_profile.restaurant_name IS NOT NULL
       AND user_profile.restaurant_address IS NOT NULL
       AND user_profile.restaurant_lat IS NOT NULL
       AND user_profile.restaurant_lng IS NOT NULL THEN
      completion := completion + 30;
    END IF;

    -- Business verified (40%)
    SELECT EXISTS (
      SELECT 1 FROM business_verifications
      WHERE owner_id = target_user_id
      AND status = 'verified'
    ) INTO has_business;

    IF has_business THEN
      completion := completion + 40;
    END IF;
  END IF;

  RETURN completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to auto-update completion on profile changes
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  -- Calculate new completion percentage
  new_completion := calculate_profile_completion(NEW.id);

  -- Update profile with new values
  UPDATE profiles
  SET
    profile_completion_percentage = new_completion,
    can_apply = (NEW.role = 'worker' AND new_completion >= 80),
    can_post_jobs = (NEW.role = 'owner' AND new_completion >= 70),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles table
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;
CREATE TRIGGER trigger_update_profile_completion
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();

-- Trigger function for language_skills changes
CREATE OR REPLACE FUNCTION update_profile_on_language_change()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  -- Recalculate profile completion
  new_completion := calculate_profile_completion(NEW.user_id);

  -- Update profile
  UPDATE profiles
  SET
    profile_completion_percentage = new_completion,
    can_apply = (role = 'worker' AND new_completion >= 80),
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on language_skills table
DROP TRIGGER IF EXISTS trigger_language_skills_update_profile ON language_skills;
CREATE TRIGGER trigger_language_skills_update_profile
AFTER INSERT OR UPDATE ON language_skills
FOR EACH ROW
EXECUTE FUNCTION update_profile_on_language_change();

-- Trigger function for identity_verifications changes
CREATE OR REPLACE FUNCTION update_profile_on_identity_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- If identity verified, update profile
  IF NEW.status = 'verified' AND (OLD IS NULL OR OLD.status != 'verified') THEN
    UPDATE profiles
    SET
      is_verified = TRUE,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on identity_verifications table
DROP TRIGGER IF EXISTS trigger_identity_verified ON identity_verifications;
CREATE TRIGGER trigger_identity_verified
AFTER UPDATE ON identity_verifications
FOR EACH ROW
EXECUTE FUNCTION update_profile_on_identity_verified();

-- Comments
COMMENT ON FUNCTION calculate_profile_completion IS 'Calculates profile completion percentage based on role-specific requirements';
COMMENT ON FUNCTION update_profile_completion IS 'Trigger function to auto-update profile completion when profile changes';
