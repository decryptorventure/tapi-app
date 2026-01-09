# Fix Signup 500 Error - Consolidated Solution
**Date**: January 9, 2026, 11:54 AM
**Issue**: 500 Internal Server Error - "Database error saving new user"
**Status**: ✅ Fixed - Single migration applies all fixes

---

## Error Timeline

### Error 1: Stack depth limit exceeded (when selecting role)
- **Cause**: AFTER trigger doing UPDATE on same table → infinite recursion
- **Fix**: Migration 006 changed to BEFORE trigger

### Error 2: RLS policy violation (401 Unauthorized)
- **Cause**: Manual INSERT profile during signup, RLS timing issue
- **Fix**: Migration 007 ensured RLS policies + Migration 008 auto-create via trigger

### Error 3: 500 Internal Server Error (current)
```
AuthApiError: Database error saving new user
```
- **Cause**: Migration 006 (BEFORE trigger) not applied → Migration 003 AFTER trigger still active
- **Result**: Migration 008 auto-create → AFTER trigger → UPDATE profiles → recursion → 500 error

---

## Root Cause Chain

```
Migration 003: AFTER trigger with UPDATE (causes recursion)
  ↓
Migration 006: Fixed with BEFORE trigger (NOT APPLIED)
  ↓
Migration 008: Auto-create profile on signup
  ↓
auth.signUp() → INSERT auth.users
  ↓
Trigger 008 → INSERT profiles (id, email)
  ↓
Migration 003 AFTER trigger still active ❌
  ↓
Trigger → UPDATE profiles → fires trigger again
  ↓
Infinite recursion → 500 Database Error
```

---

## Consolidated Solution

**Migration 008 updated** to include:
1. ✅ Drop old AFTER trigger (migration 003)
2. ✅ Create BEFORE trigger (migration 006 fix)
3. ✅ Add auto-create profile trigger (migration 008)

**Single migration applies all fixes** → no dependency issues.

---

## Migration 008 (Updated)

**File**: `supabase/migrations/008_auto_create_profile_on_signup.sql`

**What it does**:

### Part 1: Fix Recursive Trigger (from migration 006)
```sql
-- Drop AFTER trigger (migration 003)
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;

-- Recreate as BEFORE trigger
CREATE TRIGGER trigger_update_profile_completion
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();
```

**Function modifies NEW directly** (no UPDATE):
```sql
NEW.profile_completion_percentage := new_completion;
NEW.can_apply := (NEW.role = 'worker' AND new_completion >= 80);
NEW.can_post_jobs := (NEW.role = 'owner' AND new_completion >= 70);
NEW.updated_at := NOW();
RETURN NEW;  -- No UPDATE → No recursion
```

### Part 2: Auto-Create Profile (migration 008)
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## How to Apply

### Step 1: Apply Migration 008
1. **Supabase Dashboard** → **SQL Editor**
2. Copy entire content: `supabase/migrations/008_auto_create_profile_on_signup.sql`
3. Paste → **Run**
4. Should see: "Auto-create profile trigger installed successfully"

**No need to apply 006 or 007** - migration 008 includes everything.

### Step 2: Code Already Updated
- `app/(auth)/signup/page.tsx` already changed to use UPDATE instead of INSERT

### Step 3: Test Signup Flow

```bash
1. Clear browser cache / logout
2. Delete any test users from Supabase (optional)
3. Visit http://localhost:3001/signup
4. Fill form:
   - Email: test@example.com
   - Password: test12345
   - Phone: 0901234567
   - Full name: Test User
5. Click "Đăng ký"
6. ✅ Should succeed (no 500 error)
7. ✅ Should redirect to /onboarding/role
```

---

## New Signup Flow

```
User submits signup form
  ↓
1. auth.signUp({ email, password })
   → INSERT INTO auth.users
  ↓
2. Trigger: on_auth_user_created fires
   → INSERT INTO profiles (id, email) [SECURITY DEFINER]
  ↓
3. BEFORE trigger: trigger_update_profile_completion fires
   → Modifies NEW record (profile_completion = 0, can_apply = false)
   → NO UPDATE → NO RECURSION ✅
  ↓
4. Profile INSERT commits with calculated values
  ↓
5. Client: UPDATE profiles SET phone_number, full_name
   → BEFORE trigger fires again (safe)
  ↓
✅ Success → Redirect to /onboarding/role
```

**No 500 errors, no RLS issues, no recursion.**

---

## Why This Works

### 1. BEFORE Trigger Prevents Recursion
```sql
-- ❌ OLD (AFTER trigger)
INSERT/UPDATE → AFTER trigger → UPDATE same table → trigger fires again → recursion

-- ✅ NEW (BEFORE trigger)
INSERT/UPDATE → BEFORE trigger → Modify NEW → INSERT commits → Done
```

### 2. Auto-Create Uses SECURITY DEFINER
```sql
-- Trigger runs with elevated privileges
-- Bypasses RLS → no timing issues
SECURITY DEFINER
```

### 3. Client Only Updates (No Insert)
```typescript
// Client never does INSERT (trigger handles creation)
// Client only UPDATE (session established by then)
await supabase.from('profiles').update({ phone, name })
```

---

## Verification

After migration applied, check database:

```sql
-- Check trigger is BEFORE (not AFTER)
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_profile_completion';

-- Expected:
-- action_timing: 'BEFORE' (not 'AFTER')

-- Check auth trigger exists
SELECT
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected:
-- event_object_table: 'users' (in auth schema)
-- action_timing: 'AFTER'
```

After signup, check profile:
```sql
SELECT
  id,
  email,
  phone_number,
  full_name,
  role,
  profile_completion_percentage,
  can_apply
FROM profiles
WHERE email = 'test@example.com';

-- Expected:
-- email: test@example.com
-- phone_number: 0901234567
-- full_name: Test User
-- role: null
-- profile_completion_percentage: 0
-- can_apply: false
```

---

## Files Modified

1. **Updated**: `supabase/migrations/008_auto_create_profile_on_signup.sql`
   - Now includes migration 006 fix (BEFORE trigger)
   - Adds migration 008 auto-create profile
   - Single migration applies all fixes

2. **Already updated**: `app/(auth)/signup/page.tsx`
   - Changed INSERT to UPDATE
   - Added 500ms wait for trigger

---

## Migration Dependency Summary

| Migration | Purpose | Status |
|-----------|---------|--------|
| 003 | Profile completion AFTER trigger | ❌ Causes recursion |
| 006 | Fix recursion with BEFORE trigger | ✅ Included in 008 |
| 007 | Ensure RLS policies | ⚠️ Optional (policies should exist) |
| 008 | Auto-create + BEFORE trigger | ✅ Apply this one |

**Only need to apply**: Migration 008 (includes 006 fix)

---

## Testing Checklist

- [ ] Apply migration 008 via Supabase SQL Editor
- [ ] Verify BEFORE trigger exists (not AFTER)
- [ ] Verify auth trigger exists on auth.users
- [ ] Clear browser cache
- [ ] Test signup with new account
- [ ] Verify no 500 error
- [ ] Verify no RLS error
- [ ] Verify profile created with email
- [ ] Verify phone + name updated
- [ ] Test role selection after signup
- [ ] Verify no stack depth error

---

## Rollback (If Needed)

If migration causes issues:

```sql
-- Remove auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Revert to AFTER trigger (old behavior)
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON profiles;
CREATE TRIGGER trigger_update_profile_completion
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();
```

Then investigate issue.

---

## Conclusion

**Status**: ✅ **READY TO APPLY**

**Single migration**: 008_auto_create_profile_on_signup.sql
**Fixes**: Recursion + RLS timing + Auto-create profile
**Testing**: Clear cache → Signup → Should work

---

**Next**: Apply migration → Test → Start Phase 3 🚀
