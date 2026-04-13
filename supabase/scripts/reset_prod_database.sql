-- ==============================================================================
-- DATABASE RESET SCRIPT (PRODUCTION ENVIRONMENT)
-- WARNING: This script deletes real user data. Only run when absolutely sure.
-- ==============================================================================

-- BƯỚC 1: Xóa trắng toàn bộ dữ liệu File Upload (Ảnh, Video, CCCD)
DELETE FROM storage.objects;

-- BƯỚC 2: Xóa trắng toàn bộ Người dùng từ bảng Authentication System chính thức
-- LƯU Ý: Đổi 'admin@tapi.vn' thành email admin thực tế mà bạn muốn giư lại nhé!
DELETE FROM auth.users 
WHERE email != 'admin@tapi.vn';

-- => Sau khi auth.users bị xóa, cơ chế CASCADE sẽ TỰ ĐỘNG xóa toàn bộ:
--   - Dữ liệu ở public.profiles
--   - Các Jobs (Bảng jobs)
--   - Các đơn ứng tuyển (job_applications)
--   - Dữ liệu Check-in (checkins)
--   - Dữ liệu Chat / Thông báo (chat_messages, notifications)
--   - Các đơn rút tiền, tài khoản liên kết (withdrawals...)

-- BƯỚC 3: Dọn dẹp sạch Master Data (Huy hiệu, Worker Grades, Log Lịch sử) 
-- Reset luôn cho chắc chắn vì bạn đã nói chưa dùng tới
TRUNCATE TABLE public.badges CASCADE;
TRUNCATE TABLE public.worker_grades CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.penalties CASCADE;
TRUNCATE TABLE public.reliability_history CASCADE;

-- Hoàn tất! Database sẽ trở lại như mới ban đầu. Mọi user cũ vào app đều bị force logout.
