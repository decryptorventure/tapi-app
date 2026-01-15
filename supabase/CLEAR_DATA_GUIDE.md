# Hướng dẫn Clear Dữ liệu Test trên Supabase

## ⚠️ CẢNH BÁO QUAN TRỌNG
- Script này sẽ **XÓA TOÀN BỘ** dữ liệu trong database
- Chỉ chạy trên **development/staging** environment
- **KHÔNG BAO GIỜ** chạy trên production!

---

## Phương pháp 1: Sử dụng Supabase Dashboard (Khuyên dùng)

### Bước 1: Truy cập Supabase Dashboard
1. Đăng nhập vào [https://supabase.com](https://supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** (biểu tượng `</>` ở sidebar)

### Bước 2: Chạy SQL Script
1. Click **New Query**
2. Copy toàn bộ nội dung file `supabase/clear-test-data.sql`
3. Paste vào SQL Editor
4. Click **Run** (hoặc Cmd/Ctrl + Enter)

### Bước 3: Xác nhận kết quả
Sau khi chạy xong, bạn sẽ thấy bảng kết quả:
```
table_name              | row_count
------------------------|----------
profiles                | 0
language_skills         | 0
jobs                    | 0
job_applications        | 0
checkins                | 0
reliability_history     | 0
wallet_transactions     | 0
```

Tất cả phải là **0** rows.

---

## Phương pháp 2: Clear từng bảng riêng lẻ (An toàn hơn)

Nếu bạn muốn xóa từng loại dữ liệu cụ thể:

### Xóa chỉ Job Applications và Jobs
```sql
DELETE FROM public.job_applications;
DELETE FROM public.jobs;
```

### Xóa chỉ Worker/Owner profiles (giữ lại auth users)
```sql
-- Xóa language skills trước
DELETE FROM public.language_skills WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'worker'
);

-- Xóa worker profiles
DELETE FROM public.profiles WHERE role = 'worker';

-- Hoặc xóa owner profiles
DELETE FROM public.profiles WHERE role = 'owner';
```

### Xóa chỉ Check-in records
```sql
DELETE FROM public.checkins;
DELETE FROM public.reliability_history;
```

---

## Phương pháp 3: Reset toàn bộ Database (Cực đoan)

Nếu bạn muốn reset hoàn toàn database về trạng thái ban đầu:

### Bước 1: Backup (Quan trọng!)
1. Vào **Database** → **Backups**
2. Click **Create backup** để tạo snapshot

### Bước 2: Drop và Recreate Schema
```sql
-- Drop tất cả tables
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.reliability_history CASCADE;
DROP TABLE IF EXISTS public.checkins CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.language_skills CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS language_type CASCADE;
DROP TYPE IF EXISTS language_level CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS checkin_type CASCADE;
```

### Bước 3: Chạy lại Schema
Copy toàn bộ nội dung `supabase/schema.sql` và chạy trong SQL Editor.

---

## Phương pháp 4: Sử dụng Supabase CLI (Advanced)

```bash
# 1. Login vào Supabase
supabase login

# 2. Link project
supabase link --project-ref your-project-ref

# 3. Reset database
supabase db reset

# 4. Apply migrations
supabase db push
```

---

## Checklist sau khi Clear

- [ ] Verify tất cả tables đều có 0 rows
- [ ] Test tạo user mới (signup)
- [ ] Test tạo job mới
- [ ] Test apply job
- [ ] Kiểm tra RLS policies vẫn hoạt động

---

## Troubleshooting

### Lỗi: "permission denied"
→ Đảm bảo bạn đang dùng **service_role key** trong SQL Editor

### Lỗi: "violates foreign key constraint"
→ Chạy script theo đúng thứ tự (từ child tables → parent tables)

### Lỗi: "cannot delete from table due to RLS"
→ Tạm thời disable RLS:
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ... delete data ...
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

## Lưu ý quan trọng

1. **Auth Users**: Khi xóa `profiles`, Supabase auth users cũng sẽ bị xóa (do CASCADE)
2. **Storage**: Script này không xóa files trong Supabase Storage (avatars, certificates, etc.)
3. **Realtime**: Nếu có realtime subscriptions, cần restart chúng sau khi clear data

---

## Xóa Storage Files (Nếu cần)

```sql
-- List all buckets
SELECT * FROM storage.buckets;

-- Delete all files in a bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';
DELETE FROM storage.objects WHERE bucket_id = 'certificates';
```

Hoặc dùng Dashboard:
1. Vào **Storage**
2. Chọn bucket
3. Select all → Delete

---

**Hoàn thành!** Database của bạn đã sạch sẽ và sẵn sàng cho production data. 🎉
