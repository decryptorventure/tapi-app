-- Debug script to check language_skills table structure and data

-- 1. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'language_skills'
ORDER BY ordinal_position;

-- 2. Check if there's any data
SELECT COUNT(*) as total_records FROM public.language_skills;

-- 3. View sample data (if any)
SELECT 
  id,
  user_id,
  language,
  level,
  verification_status,
  certificate_url,
  created_at
FROM public.language_skills
LIMIT 10;

-- 4. Check for any records with NULL language (shouldn't exist due to NOT NULL constraint)
SELECT COUNT(*) as null_language_count
FROM public.language_skills
WHERE language IS NULL;

-- 5. Check unique constraint
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'language_skills'
  AND table_schema = 'public';
