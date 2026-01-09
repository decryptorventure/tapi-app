# Authentication Flow Fixes Report
**Date**: January 9, 2026, 10:58 AM
**Issue**: Trang đầu tiên không phải login, lỗi khi chọn role

---

## Vấn Đề Ban Đầu

User báo cáo 2 vấn đề:

1. **Trang đầu tiên không phải login mà là role selection**
   - Khi vào app, user thấy trang `/onboarding/role` thay vì landing page hoặc login

2. **Lỗi khi chọn role**
   - Khi click chọn worker/owner, hệ thống báo "Lỗi chọn vai trò"

---

## Nguyên Nhân

### Vấn đề 1: Home Page Auto-Redirect

**File**: `app/page.tsx`

**Nguyên nhân**:
```typescript
if (user) {
  // ...
  } else if (!profile?.role) {
    router.push('/onboarding/role');  // ❌ Auto redirect
    return;
  }
}
```

- Home page tự động redirect user đã authenticated đến `/onboarding/role` nếu chưa có role
- Gây confusion vì user chưa chọn hành động gì
- User có thể có session cookie từ lần login trước

### Vấn đề 2: Role Selection Auth Check

**File**: `app/onboarding/role/page.tsx`

**Nguyên nhân**:
```typescript
const handleRoleSelect = async (role) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated'); // ❌ Throw error
  // ...
}
```

**Flow có vấn đề**:
1. User chưa login
2. Home page redirect đến `/onboarding/role`
3. Role selection page không check auth khi load
4. User click chọn role
5. Code check auth → không có user → throw error
6. Catch error → toast "Lỗi chọn vai trò" (không rõ ràng)

---

## Giải Pháp Đã Áp Dụng

### Fix 1: Home Page - Remove Auto-Redirect

**File**: `app/page.tsx`

**Thay đổi**:
```typescript
// BEFORE
if (user) {
  if (profile?.role === 'worker') {
    router.push('/worker/dashboard');
  } else if (profile?.role === 'owner') {
    router.push('/owner/dashboard');
  } else if (!profile?.role) {
    router.push('/onboarding/role'); // ❌ Auto redirect
  }
}

// AFTER
if (user) {
  // Only redirect if user has completed onboarding
  if (profile?.role === 'worker' && profile?.onboarding_completed) {
    router.push('/worker/dashboard');
    return;
  } else if (profile?.role === 'owner' && profile?.onboarding_completed) {
    router.push('/owner/dashboard');
    return;
  }
  // ✅ If has role but not completed, or no role yet - stay on landing page
  // User can click buttons to continue
}
```

**Kết quả**:
- ✅ Landing page luôn hiển thị cho user chưa hoàn thành onboarding
- ✅ User có control - click "Đăng ký" hoặc "Đăng nhập" mới vào flow
- ✅ Không còn auto-redirect gây confusion

### Fix 2: Role Selection - Add Auth Check on Mount

**File**: `app/onboarding/role/page.tsx`

**Thay đổi**:
```typescript
// ✅ Add useEffect to check auth when component mounts
useEffect(() => {
  const checkAuth = async () => {
    const supabase = createUntypedClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated - redirect to login
      router.push('/login?message=Vui lòng đăng nhập trước');
      return;
    }

    // Check if user already has a role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile?.role && profile.onboarding_completed) {
      // Already completed - redirect to dashboard
      router.push(profile.role === 'worker' ? '/worker/dashboard' : '/owner/dashboard');
      return;
    }

    if (profile?.role && !profile.onboarding_completed) {
      // Has role but not completed - redirect to onboarding
      router.push(`/onboarding/${profile.role}/profile`);
      return;
    }

    // ✅ No role yet - show role picker
    setChecking(false);
  };

  checkAuth();
}, [router]);

// ✅ Show loading while checking
if (checking) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
```

**Kết quả**:
- ✅ Check auth ngay khi vào trang
- ✅ Redirect về login nếu chưa authenticated
- ✅ Redirect đúng nơi nếu đã có role
- ✅ Hiển thị loading UI trong khi check

### Fix 3: Better Error Messages

**File**: `app/onboarding/role/page.tsx`

**Thay đổi**:
```typescript
// BEFORE
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated'); // ❌ Generic error

// AFTER
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  toast.error('Vui lòng đăng nhập trước'); // ✅ Clear message
  router.push('/login');
  return;
}

// Also improved database error messages
if (error) {
  console.error('Upsert error:', error);
  toast.error(`Lỗi database: ${error.message}`); // ✅ Show actual error
  throw error;
}
```

**Kết quả**:
- ✅ Error messages rõ ràng, dễ hiểu
- ✅ User biết cần làm gì (đăng nhập)
- ✅ Dev có thông tin để debug (database error details)

---

## Flow Mới (Đã Sửa)

### Flow 1: User Mới (Chưa Login)

```
1. Visit / (Landing Page)
   ↓
2. Click "Đăng ký" → /signup
   ↓
3. Fill form + Submit → Create account
   ↓
4. Redirect to /onboarding/role
   ↓ (Check auth on mount)
5. ✅ User authenticated → Show RolePicker
   ↓
6. Select Worker/Owner → Save role
   ↓
7. Redirect to /onboarding/{role}/profile
```

### Flow 2: User Đã Login Nhưng Chưa Chọn Role

```
1. Visit / (Landing Page)
   ↓ (Check auth: has user but no role, not completed)
2. ✅ Stay on landing page (no auto-redirect)
   ↓
3. Click "Đăng nhập" or "Bắt đầu"
   ↓ (Middleware checks auth + profile)
4. Redirect to /onboarding/role
   ↓
5. ✅ Show RolePicker (auth already checked)
   ↓
6. Select role → Continue onboarding
```

### Flow 3: User Đã Hoàn Thành Onboarding

```
1. Visit / (Landing Page)
   ↓ (Check auth: has role + completed)
2. Auto-redirect to /worker/dashboard or /owner/dashboard
   ↓
3. ✅ Vào thẳng dashboard
```

---

## Testing Checklist

Để verify các fixes:

### Test 1: User Chưa Login
- [ ] Visit http://localhost:3001/
- [ ] ✅ Should see landing page (not role selection)
- [ ] ✅ Should see "Đăng ký" and "Đăng nhập" buttons
- [ ] Click "Đăng ký" → Should go to /signup
- [ ] Try visiting /onboarding/role directly
- [ ] ✅ Should redirect to /login

### Test 2: User Đã Signup Nhưng Chưa Chọn Role
- [ ] Complete signup flow
- [ ] ✅ Should auto-redirect to /onboarding/role
- [ ] ✅ Should see RolePicker (not error)
- [ ] Select Worker
- [ ] ✅ Should show success toast
- [ ] ✅ Should redirect to /onboarding/worker/profile

### Test 3: User Có Session Nhưng Chưa Hoàn Thành Onboarding
- [ ] Have authenticated user with role but not completed
- [ ] Visit /
- [ ] ✅ Should stay on landing page (no auto-redirect)
- [ ] Click "Đăng nhập"
- [ ] ✅ Middleware should redirect to appropriate onboarding step

### Test 4: User Đã Hoàn Thành Onboarding
- [ ] Have completed user (role + onboarding_completed=true)
- [ ] Visit /
- [ ] ✅ Should auto-redirect to dashboard
- [ ] Worker → /worker/dashboard
- [ ] Owner → /owner/dashboard

---

## Files Modified

1. **`app/page.tsx`**
   - Removed auto-redirect for users without role
   - Only redirect if onboarding completed

2. **`app/onboarding/role/page.tsx`**
   - Added auth check on component mount
   - Added loading state while checking
   - Improved error messages
   - Better user feedback

---

## Impact

### User Experience
- ✅ **Clear entry point**: Landing page is consistent
- ✅ **No confusion**: User controls navigation
- ✅ **Better errors**: Know exactly what went wrong
- ✅ **Smooth flow**: Proper redirects based on state

### Developer Experience
- ✅ **Clearer logic**: Auth checks at page level
- ✅ **Easier debugging**: Better error messages
- ✅ **Maintainable**: Explicit flow control
- ✅ **Testable**: Clear test cases

### Security
- ✅ **Protected routes**: Auth checked before showing UI
- ✅ **Proper redirects**: No unauthorized access
- ✅ **State validation**: Check role and completion status

---

## Known Limitations

1. **Session Management**
   - User session persists in browser
   - If user closes tab and comes back, may have stale session
   - **Mitigation**: Auth checks on mount handle this

2. **Concurrent Tabs**
   - If user completes onboarding in one tab, other tabs may not update
   - **Mitigation**: Middleware will redirect on navigation

3. **Direct URL Access**
   - User can try to access /onboarding/role directly
   - **Solution**: ✅ Now properly checks auth and redirects

---

## Next Steps

### Recommended Testing
1. Test complete signup → onboarding flow
2. Test with different browser states (incognito, logged out, etc.)
3. Test concurrent tab scenarios
4. Test back button navigation

### Future Improvements
1. **Real-time State Sync**
   - Use Supabase Realtime to sync auth state across tabs
   - Update UI when user completes onboarding in another tab

2. **Session Refresh**
   - Implement automatic session refresh
   - Show "Session expired" message and prompt re-login

3. **Onboarding Progress**
   - Add progress indicator in onboarding flow
   - Allow users to save and resume later

---

## Conclusion

**Status**: ✅ **FIXED**

Cả 2 vấn đề đã được giải quyết:

1. ✅ **Landing page hiển thị đúng** - Không còn auto-redirect
2. ✅ **Role selection hoạt động** - Check auth trước khi show UI, error messages rõ ràng

Application flow giờ đã logic và user-friendly. User có control đầy đủ về navigation và biết chính xác trạng thái của mình.

**Ready for testing**: Có thể test flow signup → role selection → onboarding ngay bây giờ.
