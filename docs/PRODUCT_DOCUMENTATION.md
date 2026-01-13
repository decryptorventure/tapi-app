# Tapy - Product Documentation

## Tổng quan sản phẩm

**Tapy** là nền tảng tuyển dụng "Just-in-Time" đầu tiên tại Việt Nam, kết nối các nhà hàng Nhật/Hàn với nhân viên part-time có kỹ năng ngôn ngữ được xác minh.

---

## 🎯 Vấn đề giải quyết

### Đối với Nhà hàng
- **Thiếu nhân viên có kỹ năng ngôn ngữ** phục vụ khách Nhật/Hàn
- **Quy trình tuyển dụng chậm** - mất nhiều ngày để tìm người phù hợp
- **Không thể xác minh** trình độ ngôn ngữ thực sự
- **Rủi ro nhân viên vắng mặt** không có cách kiểm soát

### Đối với Người tìm việc
- **Khó tìm việc phù hợp** với kỹ năng ngôn ngữ đặc biệt
- **Quy trình apply phức tạp** - điền form, chờ phỏng vấn
- **Không rõ tiêu chí** được nhận hay không
- **Thu nhập không ổn định** - không có đủ việc làm

---

## 💡 Giải pháp Tapy

### 1. Instant Book - Nhận việc ngay lập tức
Hệ thống tự động duyệt ứng viên đủ điều kiện mà không cần chờ owner xét duyệt:
- ✅ Chứng chỉ ngôn ngữ được xác minh
- ✅ Trình độ đạt yêu cầu (VD: JLPT N3 cho yêu cầu N4)
- ✅ Điểm Reliability đạt ngưỡng
- ✅ Tài khoản không bị đóng băng

### 2. Xác minh kỹ năng ngôn ngữ
- **Nhật**: JLPT N5 → N1
- **Hàn**: TOPIK 1 → 6  
- **Anh**: CEFR A1 → C2
- Upload chứng chỉ → Xác minh

### 3. Check-in QR Code
- Quét mã QR để ghi nhận giờ làm
- Phát hiện trễ giờ tự động
- Chống gian lận với signature bảo mật

### 4. Hệ thống Reliability Score
- Điểm tin cậy từ 0-100
- +1 điểm khi check-in đúng giờ
- -20 điểm + đóng băng 7 ngày nếu vắng mặt
- Điểm cao = Nhiều cơ hội Instant Book hơn

---

## 📱 Tính năng sản phẩm

### Dành cho Worker (Người tìm việc)

| Tính năng | Mô tả |
|-----------|-------|
| **Job Feed** | Danh sách việc làm real-time, lọc theo ngôn ngữ, khu vực |
| **Chi tiết công việc** | Xem lương, thời gian, yêu cầu, ảnh nhà hàng |
| **Instant Book** | Nhận việc ngay nếu đủ điều kiện |
| **Request to Book** | Gửi đơn chờ duyệt nếu chưa đủ điều kiện |
| **QR Check-in** | Hiển thị QR code để check-in tại nhà hàng |
| **Dashboard** | Xem ca làm sắp tới, lịch sử, thu nhập |
| **Profile** | Quản lý thông tin, chứng chỉ ngôn ngữ |
| **Chat** | Nhắn tin với chủ nhà hàng |
| **Notifications** | Thông báo duyệt đơn, nhắc ca làm |

### Dành cho Owner (Chủ nhà hàng)

| Tính năng | Mô tả |
|-----------|-------|
| **Dashboard** | Thống kê tổng quan, ca làm hôm nay |
| **Đăng tin tuyển** | Tạo job với yêu cầu ngôn ngữ, lương, thời gian |
| **Quản lý đơn ứng tuyển** | Xem, duyệt, từ chối đơn |
| **Quét QR** | Scan mã QR của worker để ghi nhận check-in |
| **Đánh dấu vắng mặt** | Xử lý worker không đến |
| **Chat** | Nhắn tin với ứng viên |
| **Hồ sơ nhà hàng** | Upload ảnh, mô tả nhà hàng |

### Tính năng chung

| Tính năng | Mô tả |
|-----------|-------|
| **Đa ngôn ngữ** | Hỗ trợ Việt, Anh, Nhật, Hàn |
| **PWA** | Cài đặt như app native trên điện thoại |
| **Realtime** | Cập nhật trạng thái tức thì |
| **Responsive** | Hoạt động tốt trên mobile và desktop |

---

## 🔐 Bảo mật

- **Row Level Security (RLS)**: Data isolation - User A không thấy dữ liệu của User B
- **QR Code có chữ ký HMAC**: Không thể giả mạo hoặc sửa đổi
- **Thời hạn QR**: Hết hạn sau ca làm
- **Xác thực đa lớp**: Email + OTP

---

## 📊 Metrics & KPIs

| Metric | Mục tiêu |
|--------|----------|
| Instant Book Rate | >70% |
| Check-in Success | >90% |
| No-show Rate | <5% |
| Uptime | 99.5% |

---

## 🛤️ Roadmap

### ✅ MVP 1.0 (Hoàn thành)
- Core job matching engine
- Instant Book / Request to Book
- QR Check-in system
- Reliability scoring
- Owner/Worker dashboards
- Notifications & Chat

### 🔜 v1.1 (Q2 2026)
- Push notifications (FCM)
- SMS reminders
- Advanced analytics

### 📋 v2.0 (Q3 2026)
- E-contract signing
- Wallet & payment integration
- MoMo/ZaloPay payout

### 🚀 v3.0 (Q4 2026)
- Hanoi expansion
- Enterprise API
- AI job matching

---

## 💰 Thông tin cho Nhà đầu tư

### Thị trường mục tiêu

- **TAM (Total)**: $2.3B - Thị trường lao động part-time Việt Nam
- **SAM (Serviceable)**: $450M - F&B tại TP.HCM và Hà Nội
- **SOM (Obtainable)**: $45M - Nhà hàng Nhật/Hàn cần nhân viên có kỹ năng ngôn ngữ

### Mô hình doanh thu

1. **Phí giao dịch**: 10-15% mỗi ca làm hoàn thành
2. **Gói premium Owner**: Đăng tin ưu tiên, analytics
3. **Gói premium Worker**: Hiển thị ưu tiên, instant payout

### Lợi thế cạnh tranh

| Yếu tố | Tapy | Đối thủ truyền thống |
|--------|------|---------------------|
| Thời gian matching | <5 phút (Instant Book) | 1-3 ngày |
| Xác minh ngôn ngữ | Tự động từ chứng chỉ | Phỏng vấn thủ công |
| Check-in | QR code real-time | Không có |
| Đánh giá tin cậy | Reliability Score | Không có |

### Công nghệ

- **Next.js 14** + **TypeScript** - Modern web framework
- **Supabase** - Scalable PostgreSQL + Auth + Realtime
- **Vercel** - Global edge deployment
- **PWA** - Native app experience

---

## 🏢 Đội ngũ

*[Thông tin đội ngũ sẽ được cập nhật]*

---

## 📞 Liên hệ

- **Website**: tapy.vn
- **Email**: hello@tapy.vn
- **Hỗ trợ**: support@tapy.vn
