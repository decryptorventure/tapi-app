# v2.1 Development Plan: AI Assistant & Profile Enhancement

## Tổng quan

**Phiên bản:** 2.1.0  
**Thời gian dự kiến:** 2-3 tuần  
**Mục tiêu:** Nâng cao trải nghiệm người dùng với AI Assistant và Profile Pages chuyên nghiệp

---

## 🎯 Core Features (User Requested)

### 1. 🤖 AI Virtual Assistant

**Mục tiêu:** Người dùng chỉ cần chat với AI để thực hiện mọi thao tác

#### Cho Worker:
- Điền thông tin profile (tên, số điện thoại, ngân hàng...)
- Thêm/sửa kỹ năng ngôn ngữ
- Tìm việc phù hợp
- Ứng tuyển việc làm
- Xem lịch làm việc
- Hủy đơn ứng tuyển (với cảnh báo penalty)

#### Cho Owner:
- Tạo job mới (điền form qua chat)
- Chỉnh sửa job đã đăng
- Xem danh sách ứng viên
- Duyệt/Từ chối ứng viên
- Cập nhật thông tin nhà hàng

#### Công nghệ:
- **LLM:** Claude 3.5 Sonnet hoặc GPT-4o
- **Function Calling:** Để AI thực thi các action
- **Context:** User profile + current page + conversation history

#### UI:
- Floating chat bubble góc phải
- Full-screen chat trên mobile
- Quick actions suggestion
- Typing indicator + streaming response

---

### 2. 📄 Worker Profile Page (CV Online)

**Mục tiêu:** Trang profile như CV chuyên nghiệp, dễ share

#### Thông tin hiển thị:
- Ảnh đại diện lớn + cover photo
- Họ tên + Headline (VD: "Nhân viên phục vụ | JLPT N3")
- Bio/Giới thiệu bản thân
- Kỹ năng ngôn ngữ (badges)
- Điểm Reliability Score (visualized)
- Kinh nghiệm làm việc (từ lịch sử job)
- Số ca hoàn thành + đánh giá
- Liên hệ (nếu public)

#### Tính năng:
- **Public URL:** `/p/:username` hoặc `/profile/:id`
- **Share:** Copy link, share to Zalo/Facebook
- **QR Code:** Generate QR cho profile
- **PDF Export:** Download như CV

#### UI/UX:
- Modern card-based layout
- Gradient header
- Animated skill badges
- Dark/Light mode support

---

### 3. 🏪 Owner Landing Page

**Mục tiêu:** Trang profile nhà hàng chuyên nghiệp để tăng trust

#### Thông tin hiển thị:
- Hero section với ảnh nhà hàng (carousel)
- Logo + Tên nhà hàng
- Mô tả chi tiết
- Địa chỉ + Google Maps embed
- Giờ hoạt động
- Ngôn ngữ yêu cầu thường tuyển
- Thống kê: Số job đã đăng, Workers đã làm việc
- Đánh giá từ workers
- Jobs đang tuyển

#### Tính năng:
- **Public URL:** `/r/:restaurant-slug`
- **Verified Badge:** Cho nhà hàng đã xác minh
- **Quick Apply:** Nút ứng tuyển nhanh cho jobs đang mở
- **Contact:** Nút nhắn tin/liên hệ

#### UI/UX:
- Hero parallax effect
- Image gallery lightbox
- Map integration
- Responsive design

---

## 💡 Đề xuất thêm (Recommended)

### 4. ⭐ Rating & Review System

**Lý do:** Tăng trust và transparency

#### Tính năng:
- Worker đánh giá Owner sau mỗi ca
- Owner đánh giá Worker sau mỗi ca
- Rating 1-5 sao + comment
- Hiển thị rating trên profile

---

### 5. 🔔 Push Notifications (PWA)

**Lý do:** Tăng engagement và giảm no-show

#### Tính năng:
- Web Push cho PWA
- Notification permissions request
- Types: Job match, Approval, Reminder, Chat

---

### 6. 📊 Analytics Dashboard (Owner)

**Lý do:** Giúp owner hiểu hiệu quả tuyển dụng

#### Metrics:
- Số job đăng/tháng
- Tỷ lệ fill rate
- Workers hay làm việc
- Peak hours analysis

---

### 7. 🔍 Smart Job Recommendations

**Lý do:** Tăng conversion cho workers

#### Tính năng:
- Gợi ý job dựa trên:
  - Ngôn ngữ worker có
  - Lịch sử ứng tuyển
  - Location preference
  - Giờ làm ưa thích
- Push notification cho job mới phù hợp

---

### 8. 📱 Mobile App (React Native)

**Lý do:** Trải nghiệm tốt hơn, push notification native

#### Notes:
- Share codebase logic với web (services, types)
- Priority: Worker app trước
- Expo for faster development

---

## 📋 Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | AI Virtual Assistant | 2 weeks | Very High |
| 🔴 P0 | Worker Profile Page | 1 week | High |
| 🔴 P0 | Owner Landing Page | 1 week | High |
| 🟡 P1 | Rating & Review | 3 days | Medium |
| 🟡 P1 | Push Notifications | 2 days | Medium |
| 🟢 P2 | Analytics Dashboard | 3 days | Medium |
| 🟢 P2 | Smart Recommendations | 3 days | Medium |
| 🔵 P3 | Mobile App | 3 weeks | High |

---

## 🗓️ Proposed Timeline

### Week 1-2: AI Virtual Assistant
- Day 1-2: Backend integration (Anthropic/OpenAI API)
- Day 3-5: Function definitions + action handlers
- Day 6-8: Chat UI component
- Day 9-10: Testing + edge cases

### Week 3: Profile Pages
- Day 1-3: Worker CV Page
- Day 4-5: Owner Landing Page
- Day 6-7: Share/Export features

### Week 4: Enhancements
- Day 1-2: Rating & Review
- Day 3-4: Push Notifications
- Day 5-7: Testing + Polish

---

## 🔧 Technical Decisions Needed

1. **LLM Provider:** Anthropic Claude vs OpenAI GPT?
2. **AI Hosting:** API direct vs Edge Functions?
3. **Profile URLs:** Username-based vs ID-based?
4. **Push Provider:** Web Push vs Firebase?

---

## 💰 Cost Estimation

| Item | Monthly Cost (Est.) |
|------|---------------------|
| LLM API (Anthropic/OpenAI) | $50-200 (usage-based) |
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| **Total** | ~$100-250/month |

---

## 📝 Next Steps

1. ✅ Approve this plan
2. Research LLM integration patterns
3. Create detailed implementation plan for AI Assistant
4. Design Worker CV page mockup
5. Begin development
