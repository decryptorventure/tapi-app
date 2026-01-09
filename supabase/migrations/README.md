# Database Migrations - Phase 1 Foundation

This directory contains SQL migrations for the Tapy recruitment platform.

## Phase 1 Migrations

### 001_add_verification_tables.sql
Creates tables for identity and business document verification:
- `identity_verifications` - Worker ID card/passport verification
- `business_verifications` - Owner business license verification
- Includes RLS policies for data security

### 002_extend_profiles.sql
Extends the profiles table with:
- `profile_completion_percentage` - Calculated 0-100%
- `can_apply` - Worker permission flag (≥80% completion)
- `can_post_jobs` - Owner permission flag (≥70% completion)
- `onboarding_completed` - Onboarding flow tracker
- `last_active_at` - User activity timestamp

### 003_profile_completion_function.sql
Creates PostgreSQL functions and triggers:
- `calculate_profile_completion()` - Calculates completion percentage by role
- Triggers on `profiles`, `language_skills`, and `identity_verifications` tables
- Automatically updates profile completion on data changes

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Or apply specific migration
supabase db execute --file supabase/migrations/001_add_verification_tables.sql
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of each migration file in order:
   - 001_add_verification_tables.sql
   - 002_extend_profiles.sql
   - 003_profile_completion_function.sql
5. Execute each migration

### Option 3: Using psql

```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -f supabase/migrations/001_add_verification_tables.sql

psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -f supabase/migrations/002_extend_profiles.sql

psql "postgresql://postgres:[password]@[host]:5432/postgres" \
  -f supabase/migrations/003_profile_completion_function.sql
```

## Testing Migrations

### 1. Verify Tables Created

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('identity_verifications', 'business_verifications');

-- Check profiles table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'profile_completion_percentage',
    'can_apply',
    'can_post_jobs',
    'onboarding_completed'
  );
```

### 2. Test Profile Completion Function

```sql
-- Create test worker profile
INSERT INTO profiles (id, full_name, phone_number, role, date_of_birth)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Worker',
  '+84901234567',
  'worker',
  '1990-01-01'
);

-- Check completion percentage (should be 40%: 20% basic + 10% role + 10% DOB)
SELECT profile_completion_percentage, can_apply
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### 3. Test Trigger Automation

```sql
-- Add identity verification
INSERT INTO identity_verifications (
  user_id,
  id_front_url,
  id_back_url,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'https://example.com/front.jpg',
  'https://example.com/back.jpg',
  'verified'
);

-- Check if profile updated automatically (should be 70%: previous 40% + 30% identity)
-- Note: can_apply requires 80%, so should still be FALSE
SELECT profile_completion_percentage, can_apply, is_verified
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### 4. Test RLS Policies

```sql
-- Test that users can only see their own verifications
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

SELECT * FROM identity_verifications;
-- Should only return records for user_id = '00000000-0000-0000-0000-000000000001'
```

## Rollback (if needed)

To rollback these migrations:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;
DROP TRIGGER IF EXISTS trigger_language_skills_update_profile ON language_skills;
DROP TRIGGER IF EXISTS trigger_identity_verified ON identity_verifications;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_profile_completion(UUID);
DROP FUNCTION IF EXISTS update_profile_completion();
DROP FUNCTION IF EXISTS update_profile_on_language_change();
DROP FUNCTION IF EXISTS update_profile_on_identity_verified();

-- Remove columns from profiles
ALTER TABLE profiles
DROP COLUMN IF EXISTS profile_completion_percentage,
DROP COLUMN IF EXISTS can_apply,
DROP COLUMN IF EXISTS can_post_jobs,
DROP COLUMN IF EXISTS onboarding_completed,
DROP COLUMN IF EXISTS last_active_at;

-- Drop tables
DROP TABLE IF EXISTS identity_verifications;
DROP TABLE IF EXISTS business_verifications;
```

## Required Setup After Migrations

1. **Create Supabase Storage Bucket**:
   - Bucket name: `verifications`
   - Public: NO (private bucket)
   - Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`
   - File size limit: 10MB

2. **Set Environment Variables**:
   ```env
   QR_SECRET=generate-random-32-char-string
   NEXT_PUBLIC_VERIFICATIONS_BUCKET=verifications
   ```

3. **Configure Storage Policies**:
   ```sql
   -- Allow authenticated users to upload to their own folder
   CREATE POLICY "Users can upload own documents"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Allow users to read their own documents
   CREATE POLICY "Users can read own documents"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'verifications' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## Profile Completion Calculation

### Worker (80% required to apply):
- Basic info (name + phone): 20%
- Role selected: 10%
- Date of birth: 10%
- Verified language skill: 30%
- Identity verified: 30%

### Owner (70% required to post jobs):
- Basic info (name + phone): 20%
- Role selected: 10%
- Restaurant info (name + address + coordinates): 30%
- Business license verified: 40%
