# Fix Signup RLS Policy Error
**Date**: January 9, 2026, 11:31 AM
**Issue**: "new row violates row-level security policy for table profiles"
**Status**: ✅ Migration created - ready to apply

---

## Vấn Đề

### User Report
```
Đăng ký tài khoản mới → "new row violates row-level security policy for table profiles"
```

### Error Details
- Supabase RLS (Row Level Security) policy blocking profile INSERT
- User cannot complete signup flow
- Profile record creation fails after auth user created

---

## Root Cause

### Signup Flow
```typescript
// app/(auth)/signup/page.tsx
1. Create auth user → ✅ Success
2. Insert profile record:
   await supabase.from('profiles').insert({
     id: authData.user.id,  // ← RLS check: auth.uid() = id
     email: formData.email,
     phone_number: formData.phoneNumber,
     full_name: formData.fullName,
     role: null
   });
   → ❌ RLS policy violation
```

### Why RLS Blocks

**Possible causes**:
1. Migration 005 not applied to production database
2. Policy conflicts from old migrations
3. RLS enabled but no INSERT policy exists
4. Policy has wrong condition (TO clause missing)

**Expected policy**:
```sql
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated  -- ← Must specify TO authenticated
WITH CHECK (auth.uid() = id);
```

---

## Solution

### Migration Created
**File**: `supabase/migrations/007_ensure_profiles_rls_policies.sql`

**What it does**:
1. Drops ALL existing policies (clean slate)
2. Recreates 3 policies with correct permissions:
   - INSERT policy: Allow authenticated users to create own profile
   - SELECT policy: Allow users to view own profile
   - UPDATE policy: Allow users to update own profile

**Key fix**: Adds `TO authenticated` clause to all policies

---

## Apply Migration

### Step 1: Supabase Dashboard
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy contents of `supabase/migrations/007_ensure_profiles_rls_policies.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. Should see: "RLS Policies recreated successfully for profiles table"

### Step 2: Verify
Run this query in SQL Editor:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';
-- Should show: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
-- Should show 3 policies: INSERT, SELECT, UPDATE
```

---

## Testing After Fix

### Test 1: New Signup
```
1. Clear browser data (logout if logged in)
2. Visit http://localhost:3001/signup
3. Fill form:
   - Full name: "Test User"
   - Phone: "0901234567"
   - Email: "test@example.com"
   - Password: "test12345"
4. Click "Đăng ký"
5. ✅ Should succeed (no RLS error)
6. ✅ Should redirect to /onboarding/role
```

### Test 2: Check Database
```sql
-- Verify profile was created
SELECT id, email, full_name, phone_number, role
FROM profiles
WHERE email = 'test@example.com';

-- Expected result:
-- role: null
-- full_name: "Test User"
-- phone_number: "0901234567"
```

### Test 3: Complete Flow
```
1. After signup redirect to /onboarding/role
2. Select "Worker" role
3. ✅ Should update profile.role (tests UPDATE policy)
4. ✅ Should redirect to /onboarding/worker/profile
```

---

## Technical Details

### RLS Policy Components

```sql
CREATE POLICY "policy_name"
ON table_name
FOR operation        -- INSERT, SELECT, UPDATE, DELETE, ALL
TO role_name         -- authenticated, anon, public, service_role
USING (condition)    -- For SELECT, UPDATE, DELETE - read permission
WITH CHECK (condition); -- For INSERT, UPDATE - write permission
```

**For INSERT**:
- Only `WITH CHECK` applies (no USING)
- Checks condition BEFORE inserting row
- `auth.uid()` returns current authenticated user ID

**Common mistake**:
```sql
-- ❌ Missing TO clause - policy not applied correctly
CREATE POLICY "name" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ✅ Correct - specifies who policy applies to
CREATE POLICY "name" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
```

---

## Files Modified

1. **Created**: `supabase/migrations/007_ensure_profiles_rls_policies.sql`
   - Drops all existing policies
   - Creates 3 new policies with TO authenticated
   - Ensures clean RLS state

---

## Verification Checklist

After applying migration:

- [ ] Can signup new account without RLS error
- [ ] Profile record created in database
- [ ] Can select role (UPDATE policy works)
- [ ] Can view profile data (SELECT policy works)
- [ ] No "row-level security" errors in console

---

## Prevention

**Always include in RLS policies**:
```sql
TO authenticated  -- or TO anon, TO public
```

**Test RLS locally**:
```sql
-- Impersonate user (in SQL Editor)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';

-- Try INSERT
INSERT INTO profiles (id, email) VALUES ('user-uuid-here', 'test@test.com');
-- Should succeed if policy correct
```

---

## Next Steps

1. ✅ Apply migration 007 via Supabase SQL Editor
2. ✅ Test signup flow
3. ✅ Verify no RLS errors
4. Continue with Phase 3 development

---

**Ready**: Copy migration file to Supabase Dashboard → Run SQL → Test signup.
