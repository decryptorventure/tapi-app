-- Fix: Prevent infinite recursion in profile completion trigger
-- Issue: AFTER trigger with UPDATE on same table causes stack depth exceeded error
-- Solution: Use BEFORE trigger to modify NEW record directly (no UPDATE needed)

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;

-- Recreate function to work with BEFORE trigger
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  -- Calculate new completion percentage
  new_completion := calculate_profile_completion(NEW.id);

  -- Modify NEW record directly (no UPDATE needed - prevents recursion)
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

-- Similarly fix language skills trigger
DROP TRIGGER IF EXISTS trigger_language_skills_update_profile ON language_skills;

CREATE OR REPLACE FUNCTION trigger_language_skills_update_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  new_completion INT;
BEGIN
  -- Get the user_id from the language skill record
  user_id := NEW.user_id;

  -- Recalculate profile completion
  new_completion := calculate_profile_completion(user_id);

  -- Update profile completion (this is OK - different table)
  UPDATE profiles
  SET
    profile_completion_percentage = new_completion,
    can_apply = (role = 'worker' AND new_completion >= 80),
    can_post_jobs = (role = 'owner' AND new_completion >= 70),
    updated_at = NOW()
  WHERE id = user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_language_skills_update_profile
AFTER INSERT OR UPDATE ON language_skills
FOR EACH ROW
EXECUTE FUNCTION trigger_language_skills_update_profile();

-- Fix identity verification trigger
DROP TRIGGER IF EXISTS trigger_identity_verified ON verifications;

CREATE OR REPLACE FUNCTION trigger_identity_verified()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  -- Only proceed if status changed to 'verified' and type is 'identity'
  IF NEW.verification_type = 'identity' AND NEW.status = 'verified' AND
     (OLD IS NULL OR OLD.status != 'verified') THEN

    -- Mark user as verified
    UPDATE profiles
    SET is_verified = TRUE
    WHERE id = NEW.user_id;

    -- Recalculate completion
    new_completion := calculate_profile_completion(NEW.user_id);

    UPDATE profiles
    SET
      profile_completion_percentage = new_completion,
      can_apply = (role = 'worker' AND new_completion >= 80),
      can_post_jobs = (role = 'owner' AND new_completion >= 70),
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_identity_verified
AFTER INSERT OR UPDATE ON verifications
FOR EACH ROW
EXECUTE FUNCTION trigger_identity_verified();
