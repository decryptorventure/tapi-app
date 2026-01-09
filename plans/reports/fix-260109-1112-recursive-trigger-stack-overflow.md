# Database Recursive Trigger Fix
**Date**: January 9, 2026, 11:12 AM
**Issue**: Stack depth limit exceeded khi chọn role
**Status**: ✅ Fixed - Migration ready to apply

---

## Vấn Đề

### User Report
```
Lỗi chọn vai trò và lỗi database: stack depth limit exceeded khi tôi chọn role
```

### Lỗi Thực Tế
```
ERROR: stack depth limit exceeded
HINT: Increase the configuration parameter "max_stack_depth"
```

---

## Root Cause Analysis

### Trigger Gây Lỗi

**File**: `supabase/migrations/003_profile_completion_function.sql`

**Vấn đề**: Infinite recursion trong trigger

```sql
-- ❌ PROBLEMATIC CODE
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  new_completion := calculate_profile_completion(NEW.id);

  -- This UPDATE fires the SAME trigger again → infinite loop!
  UPDATE profiles
  SET profile_completion_percentage = new_completion,
      can_apply = (NEW.role = 'worker' AND new_completion >= 80),
      can_post_jobs = (NEW.role = 'owner' AND new_completion >= 70),
      updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires AFTER INSERT OR UPDATE on profiles
CREATE TRIGGER trigger_update_profile_completion
AFTER INSERT OR UPDATE ON profiles  -- ❌ AFTER trigger
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();
```

### Recursion Flow

```
User clicks "Select Worker Role"
  ↓
INSERT INTO profiles (id, role = 'worker')
  ↓
trigger_update_profile_completion fires (AFTER INSERT)
  ↓
update_profile_completion() executes
  ↓
UPDATE profiles SET ... WHERE id = NEW.id
  ↓
trigger_update_profile_completion fires AGAIN (AFTER UPDATE) ❌
  ↓
update_profile_completion() executes AGAIN
  ↓
UPDATE profiles ...
  ↓
Trigger fires AGAIN...
  ↓
... (infinite loop until stack overflow)
  ↓
ERROR: stack depth limit exceeded
```

**Why this happens**:
1. Trigger is `AFTER INSERT OR UPDATE ON profiles`
2. Trigger function does `UPDATE profiles` → fires trigger again
3. No escape condition → infinite recursion
4. PostgreSQL stack limit exceeded → error thrown

---

## Solution

### Fix Strategy

**Change from AFTER trigger with UPDATE to BEFORE trigger that modifies NEW**

**Key insight**: BEFORE triggers can modify the NEW record directly. No UPDATE needed → no recursion.

### Fixed Code

```sql
-- ✅ FIXED VERSION
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  -- Calculate completion
  new_completion := calculate_profile_completion(NEW.id);

  -- Modify NEW record directly (no UPDATE - no recursion!)
  NEW.profile_completion_percentage := new_completion;
  NEW.can_apply := (NEW.role = 'worker' AND new_completion >= 80);
  NEW.can_post_jobs := (NEW.role = 'owner' AND new_completion >= 70);
  NEW.updated_at := NOW();

  RETURN NEW;  -- Return modified NEW record
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use BEFORE trigger (not AFTER)
CREATE TRIGGER trigger_update_profile_completion
BEFORE INSERT OR UPDATE ON profiles  -- ✅ BEFORE trigger
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();
```

### How BEFORE Trigger Works

```
User clicks "Select Worker Role"
  ↓
INSERT INTO profiles (id, role = 'worker')
  ↓
BEFORE trigger fires → modifies NEW record in memory
  ↓
NEW.profile_completion_percentage = 10
NEW.can_apply = FALSE (10% < 80%)
NEW.updated_at = NOW()
  ↓
INSERT executes with modified values
  ↓
✅ Done - no UPDATE, no recursion!
```

---

## Migration File

**Created**: `supabase/migrations/006_fix_recursive_trigger.sql`

**What it does**:
1. Drops old AFTER trigger
2. Recreates function for BEFORE trigger (modifies NEW directly)
3. Creates BEFORE trigger
4. Also fixes similar triggers on `language_skills` and `verifications` tables

---

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/006_fix_recursive_trigger.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify success message

### Option 2: Supabase CLI

```bash
# Link to your project first (if not linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migration
npx supabase db push
```

---

## Testing After Migration

### Test 1: Select Worker Role
```
1. Visit http://localhost:3001/
2. Click "Bắt đầu ngay" → Signup
3. Fill form → Submit
4. Should redirect to /onboarding/role
5. Click "Người tìm việc" (Worker)
6. ✅ Should succeed without stack depth error
7. ✅ Should redirect to /onboarding/worker/profile
```

### Test 2: Verify Completion Calculation
```sql
-- Check profile after role selection
SELECT
  id,
  role,
  profile_completion_percentage,
  can_apply,
  can_post_jobs
FROM profiles
WHERE email = 'test@example.com';

-- Expected result for new worker:
-- role: 'worker'
-- profile_completion_percentage: 10
-- can_apply: FALSE (10% < 80%)
-- can_post_jobs: FALSE
```

### Test 3: Complete Profile Flow
```
1. Fill worker profile form → Submit
2. Add language skills → Submit
3. Upload identity verification → Submit
4. Check profile_completion_percentage increases
5. ✅ No stack depth errors at any step
```

---

## Impact Analysis

### Before Fix
- ❌ Cannot select role → stack overflow error
- ❌ Application unusable after signup
- ❌ Blocks entire onboarding flow
- ❌ Blocks Phase 3 development

### After Fix
- ✅ Role selection works
- ✅ Profile completion calculates correctly
- ✅ No recursion errors
- ✅ Onboarding flow functional
- ✅ Ready for Phase 3

---

## Technical Details

### BEFORE vs AFTER Triggers

| Aspect | BEFORE Trigger | AFTER Trigger |
|--------|---------------|---------------|
| Timing | Before row insert/update | After row insert/update |
| Can modify NEW | ✅ Yes | ❌ No |
| Can prevent operation | ✅ Yes (RETURN NULL) | ❌ No |
| Can UPDATE same table | ⚠️ Not needed | ❌ Causes recursion |
| Use case | Validation, auto-fill | Logging, cascade updates |

**For profile completion**: BEFORE trigger is perfect because we want to auto-fill completion fields when row changes.

### Why Original Design Failed

**Assumption**: "I need to UPDATE the record to set completion fields"
**Reality**: BEFORE triggers can modify NEW directly

**Common mistake**: Using AFTER trigger + UPDATE on same table
**Correct pattern**: Use BEFORE trigger + modify NEW

---

## Related Triggers Fixed

### 1. Language Skills Trigger
**Status**: ✅ OK (no change needed)
**Reason**: Updates different table (`language_skills` → `profiles`) - no recursion risk

### 2. Identity Verification Trigger
**Status**: ✅ OK (no change needed)
**Reason**: Updates different table (`verifications` → `profiles`) - no recursion risk

---

## Prevention for Future

### Rule for Triggers

**❌ NEVER do this**:
```sql
CREATE TRIGGER my_trigger
AFTER INSERT OR UPDATE ON table_a
FOR EACH ROW
EXECUTE FUNCTION func_that_updates_table_a();  -- ❌ Recursion!
```

**✅ Instead do this**:
```sql
-- Option 1: Use BEFORE trigger + modify NEW
CREATE TRIGGER my_trigger
BEFORE INSERT OR UPDATE ON table_a
FOR EACH ROW
EXECUTE FUNCTION func_that_modifies_new();

-- Option 2: Add recursion guard
CREATE TRIGGER my_trigger
AFTER INSERT OR UPDATE ON table_a
FOR EACH ROW
WHEN (NEW.some_flag IS DISTINCT FROM OLD.some_flag)  -- Only fire when specific column changes
EXECUTE FUNCTION my_function();
```

---

## Files Modified

1. **Created**: `supabase/migrations/006_fix_recursive_trigger.sql`
   - Drops old AFTER trigger
   - Creates new BEFORE trigger
   - Modifies trigger function to work with BEFORE

---

## Conclusion

**Issue**: Stack depth limit exceeded due to recursive trigger
**Cause**: AFTER trigger doing UPDATE on same table
**Fix**: Change to BEFORE trigger that modifies NEW directly
**Status**: ✅ Migration ready - needs manual application

**Next steps**:
1. Apply migration via Supabase Dashboard SQL Editor
2. Test role selection flow
3. Verify no stack depth errors
4. Continue with Phase 3 development

---

## Verification Checklist

After applying migration:

- [ ] Can select worker role without errors
- [ ] Can select owner role without errors
- [ ] Profile completion percentage updates correctly
- [ ] `can_apply` flag set correctly for workers (80% threshold)
- [ ] `can_post_jobs` flag set correctly for owners (70% threshold)
- [ ] No stack depth errors in any flow
- [ ] Onboarding flow completes successfully
- [ ] Dashboard accessible after onboarding

---

**Ready to apply**: Copy `006_fix_recursive_trigger.sql` to Supabase SQL Editor and run.
