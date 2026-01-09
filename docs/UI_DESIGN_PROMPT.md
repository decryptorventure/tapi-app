# UI Design Prompt: Worker Home Feed - Tapy App

## Project Context
Tapy là một nền tảng tuyển dụng "Just-in-Time" kết nối nhà hàng Nhật/Hàn tại Việt Nam với sinh viên/nhân viên part-time có kỹ năng ngôn ngữ được xác minh (tiếng Nhật/Hàn/Anh).

## Design Requirements

### 1. Visual Style & Branding

**Brand Identity:**
- **Primary Color**: Deep Blue (#1e3a8a) - tượng trưng cho sự tin cậy, chuyên nghiệp
- **Secondary Color**: Orange (#ea580c) - tượng trưng cho năng lượng, F&B industry
- **Vibe**: Professional nhưng trẻ trung, tương tự Timee (Japan) hoặc Grab (Vietnam)
- **Style**: Minimalist, clean, modern với touch của enterprise-ready design

**Typography:**
- Primary font: Inter (đã cấu hình trong project)
- Support Vietnamese, English, Japanese, Korean characters
- Font weights: Regular (400), Medium (500), Semibold (600), Bold (700)

**Spacing & Layout:**
- Container: Max width 1200px, centered với padding responsive
- Card spacing: 16px gap giữa các job cards
- Padding: 16px-24px cho mobile, 24px-32px cho desktop

### 2. Worker Home Feed Screen Structure

#### A. Header Section
```
┌─────────────────────────────────────────┐
│  [Logo Tapy]    [Search] [Notifications]│
│  [Profile Avatar]                        │
└─────────────────────────────────────────┘
```

**Components:**
- **Logo**: Top-left, "Tapy" text logo với icon (deep blue)
- **Search Bar**: Placeholder "Tìm kiếm công việc..." với filter icon
- **Notifications Bell**: Badge hiển thị số thông báo chưa đọc (orange dot)
- **Profile Avatar**: Circular, click vào mở profile menu

**Header Actions:**
- Filter button: Mở filter modal (Language, Location, Date, Rate)
- Wallet button: Hiển thị "Số dư ước tính" (Estimated Earnings)

#### B. Reliability Score Badge (Top Banner)
```
┌─────────────────────────────────────────┐
│  ⭐ Điểm Tin Cậy: 95/100                │
│  [Progress Bar: ████████░░]             │
│  Giữ điểm cao để nhận nhiều cơ hội hơn! │
└─────────────────────────────────────────┘
```

**Design:**
- Background: Gradient từ primary blue đến lighter blue
- Score display: Large, bold number
- Progress bar: Visual indicator với color coding:
  - 90-100: Green
  - 70-89: Blue
  - 50-69: Yellow
  - <50: Red
- CTA text: Nhắc nhở người dùng giữ điểm cao
- Clickable: Mở reliability history page

#### C. Job Feed (Main Content)

**Job Card Layout:**
```
┌─────────────────────────────────────────────┐
│  [Restaurant Name]  [Distance]  [Language]  │
│  [Job Title]                                 │
│  ─────────────────────────────────────────  │
│  📅 Date: DD/MM/YYYY                        │
│  ⏰ Time: HH:MM - HH:MM                     │
│  💰 Rate: XXX,XXX VNĐ/giờ                   │
│  📍 Location: [Address]                     │
│  👔 Dress Code: [Info]                      │
│  ─────────────────────────────────────────  │
│  [Language Badge] [Level Badge]             │
│  [Reliability Required Badge]               │
│  ─────────────────────────────────────────  │
│  ✅ Đủ điều kiện đặt chỗ ngay!              │
│  [✨ ĐẶT CHỖ NGAY] (Green, prominent)      │
│                                              │
│  OR                                         │
│                                              │
│  ⚠️ Cần cải thiện: [Reasons]                │
│  [📝 GỬI YÊU CẦU] (Blue, secondary)        │
└─────────────────────────────────────────────┘
```

**Card States:**

1. **Instant Book Available (Green State)**
   - Green highlight border
   - "✨ ĐẶT CHỖ NGAY" button - Green background, white text, bold
   - Checkmark icon
   - Message: "Bạn đủ điều kiện để đặt chỗ ngay lập tức!"

2. **Request Required (Blue State)**
   - Standard border
   - "📝 GỬI YÊU CẦU" button - Blue/primary background
   - Warning icon
   - Feedback message với lý do cụ thể:
     - "Trình độ ngôn ngữ chưa đạt yêu cầu"
     - "Điểm tin cậy chưa đủ (cần: 90+)"
     - "Cần hoàn tất xác minh danh tính"

3. **Not Qualified (Gray State)**
   - Grayed out card
   - Disabled button
   - Clear message về requirements

**Visual Elements:**
- **Language Badge**: 
  - Japanese: Blue badge với 🇯🇵 icon
  - Korean: Red badge với 🇰🇷 icon  
  - English: Green badge với 🇬🇧 icon
- **Level Badge**: Small, pill-shaped với level text (N3, TOPIK 2, etc.)
- **Distance**: Calculated từ worker location (if available)
- **Urgency Indicator**: Red dot nếu shift sắp đến (< 24h)

#### D. Filter & Sort Section
```
┌─────────────────────────────────────────┐
│  🔍 Filters:                            │
│  [All] [Today] [This Week] [Custom]    │
│  [All Languages] [Japanese] [Korean]   │
│  [Any Location] [Near Me] [Specific]   │
│  [Rate: Low to High] [Rate: High-Low]  │
└─────────────────────────────────────────┘
```

**Filter Options:**
- **Date Range**: Quick filters (Today, This Week, This Month) + Custom date picker
- **Language**: Multi-select (Japanese, Korean, English)
- **Location**: "Near Me" (uses geolocation) hoặc search specific area
- **Hourly Rate**: Range slider hoặc preset ranges
- **Sort By**: 
  - Date (Newest first)
  - Rate (High to Low)
  - Distance (Nearest first)
  - Relevance (matches worker skills)

#### E. Empty State
```
┌─────────────────────────────────────────┐
│          [Illustration/Icon]            │
│                                          │
│     Chưa có công việc phù hợp           │
│                                          │
│  Thử điều chỉnh bộ lọc hoặc quay lại    │
│         sau để xem thêm công việc       │
│                                          │
│        [Reset Filters]                  │
└─────────────────────────────────────────┘
```

#### F. Loading State
- Skeleton loaders cho job cards
- Animated shimmer effect
- Show 3-4 skeleton cards while loading

#### G. Pull-to-Refresh
- Native mobile pull-to-refresh gesture
- Animated loading indicator
- Smooth refresh animation

### 3. Interactive Elements

**Job Card Interactions:**
- **Tap/Click**: Mở Job Detail Page với đầy đủ thông tin
- **Swipe Actions** (Mobile):
  - Swipe right: Save/Bookmark job
  - Swipe left: Hide job (not interested)
- **Long Press**: Quick preview với tooltip

**Button States:**
- **Default**: Full color với hover effect
- **Loading**: Spinner icon + disabled state
- **Success**: Green checkmark + "Đã đặt chỗ!" message
- **Error**: Red border + error message

### 4. Responsive Design

**Mobile (< 768px):**
- Single column layout
- Stacked card elements
- Bottom navigation bar thay vì sidebar
- Full-width buttons
- Swipe gestures enabled

**Tablet (768px - 1024px):**
- 2 columns job cards
- Expanded header với more actions
- Side drawer cho filters

**Desktop (> 1024px):**
- 2-3 columns job cards grid
- Fixed sidebar với quick filters
- Hover effects trên cards
- Keyboard navigation support

### 5. Accessibility

- **WCAG 2.1 AA Compliance**
- High contrast text (min 4.5:1 ratio)
- Touch targets: Minimum 44x44px
- Screen reader support
- Keyboard navigation
- Focus indicators visible
- Alt text cho images/icons

### 6. Localization Support

**Languages:**
- Vietnamese (Default) - Tiếng Việt
- English
- Japanese - 日本語
- Korean - 한국어

**Text Examples (Vietnamese):**
- "Đặt chỗ ngay" / "Gửi yêu cầu"
- "Điểm tin cậy"
- "Công việc phù hợp với bạn"
- "Tìm kiếm công việc..."

**Language-specific considerations:**
- Text expansion: Korean/Japanese có thể cần nhiều không gian hơn
- RTL support: Not needed (all LTR languages)
- Font fallbacks cho CJK characters

### 7. Micro-interactions & Animations

**Smooth Transitions:**
- Card hover: Subtle lift effect (elevation shadow)
- Button press: Scale down 0.95x
- Page transitions: Fade in/out (300ms)
- Loading: Skeleton shimmer animation

**Feedback Animations:**
- Success: Green checkmark với bounce animation
- Error: Shake animation trên button
- Apply action: Button transforms to loading state smoothly

### 8. Performance Considerations

- **Lazy Loading**: Load images as user scrolls
- **Infinite Scroll**: Load more jobs when near bottom
- **Image Optimization**: WebP format, responsive sizes
- **Code Splitting**: Load components on demand
- **Caching**: Cache job data với React Query

### 9. Design References

**Inspiration:**
- **Timee** (Japan): Clean job listing, clear CTAs
- **Grab** (Vietnam): Local feel, vibrant colors
- **Indeed/Monster**: Professional job board layout
- **Uber Eats**: Quick action buttons, card-based design

### 10. Technical Implementation Notes

**Components Needed:**
- `JobFeed` - Main feed container
- `JobCard` - Individual job card (already created)
- `ReliabilityScoreBanner` - Score display banner
- `FilterModal` - Filter overlay/modal
- `SearchBar` - Search input component
- `LanguageBadge` - Language indicator badge
- `EmptyState` - Empty state illustration
- `LoadingSkeleton` - Loading placeholder

**State Management:**
- React Query cho data fetching
- Zustand cho UI state (filters, sort options)
- URL query params cho shareable filtered views

**API Integration:**
- GET `/api/jobs` với query params (filters, pagination)
- POST `/api/jobs/:id/apply` cho apply action
- Real-time updates: Supabase subscriptions cho new jobs

### 11. User Flow

1. **User opens app** → See reliability score banner
2. **Scrolls feed** → Sees filtered jobs matching skills
3. **Views job card** → Sees qualification status
4. **Taps "Đặt chỗ ngay"** → Instant confirmation (if qualified)
5. **Taps "Gửi yêu cầu"** → Application sent, pending owner approval
6. **Receives notification** → When application approved/rejected

### 12. Success Metrics

Design should optimize for:
- **Apply Rate**: Easy-to-find apply buttons
- **Instant Book Rate**: Clear qualification indicators
- **User Engagement**: Pull-to-refresh, smooth scrolling
- **Time to Apply**: Minimal clicks to apply
- **Accessibility Score**: WCAG AA compliance

---

## Design Deliverables

Khi thiết kế, cần cung cấp:
1. **High-fidelity mockups** cho Mobile, Tablet, Desktop
2. **Component library** với all states (default, hover, active, disabled, loading)
3. **Design system** (colors, typography, spacing, components)
4. **Interactive prototype** (Figma hoặc similar)
5. **Assets**: Icons, illustrations, images

## Questions for Design Team

1. Illustration style cho empty states? (Line art, 3D, flat?)
2. Animation preferences? (Subtle vs prominent)
3. Dark mode support needed?
4. Specific accessibility requirements beyond WCAG AA?

