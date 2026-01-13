# Worker Profile Page (CV Online) - Specification

## Tổng quan

Trang profile chuyên nghiệp cho Worker, hiển thị như CV online có thể share.

---

## URL Structure

```
/p/:username     → Primary URL (nếu có username)
/worker/:id      → Fallback URL
```

---

## Page Sections

### 1. Hero Section
```
┌─────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░ COVER PHOTO ░░░░░░░░░░░                │
│                                                     │
│     ┌───────┐                                       │
│     │ Avatar│  Nguyễn Văn A                         │
│     │  120px│  Nhân viên phục vụ | JLPT N3         │
│     └───────┘  ⭐ 4.8 (23 đánh giá) | 📍 Quận 1    │
│                                                     │
│     [Liên hệ]  [Share Profile]                      │
└─────────────────────────────────────────────────────┘
```

### 2. About Section
```
┌─────────────────────────────────────────────────────┐
│  Giới thiệu                                         │
│  ─────────────────                                  │
│  Sinh viên năm 3 ngành Ngôn ngữ Nhật, có 2 năm     │
│  kinh nghiệm làm việc tại các nhà hàng Nhật...     │
└─────────────────────────────────────────────────────┘
```

### 3. Language Skills
```
┌─────────────────────────────────────────────────────┐
│  Kỹ năng ngôn ngữ                                   │
│  ─────────────────                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 🇯🇵      │  │ 🇰🇷      │  │ 🇬🇧      │          │
│  │ Nhật N3  │  │ Hàn LV4  │  │ Anh B2   │          │
│  │ ✓ Verified│  │ ✓ Verified│  │ Pending  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### 4. Reliability Score
```
┌─────────────────────────────────────────────────────┐
│  Độ tin cậy                                         │
│  ─────────────────                                  │
│           85/100                                    │
│  ████████████████░░░░  85%                         │
│                                                     │
│  ✓ 45 ca hoàn thành    ✓ 98% đúng giờ              │
│  ✓ 0 lần vắng mặt      ✓ 4.8 đánh giá TB           │
└─────────────────────────────────────────────────────┘
```

### 5. Work History
```
┌─────────────────────────────────────────────────────┐
│  Kinh nghiệm làm việc                               │
│  ─────────────────                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🍜 Ramen Ichiban                             │   │
│  │ Nhân viên phục vụ | 15 ca | ⭐ 4.9          │   │
│  │ "Làm việc rất chuyên nghiệp, giao tiếp tốt" │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🍣 Sushi Tokyo                               │   │
│  │ Nhân viên phục vụ | 8 ca | ⭐ 4.7           │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Features

### Share Options
- **Copy Link**: Copy URL to clipboard
- **QR Code**: Generate QR cho profile
- **Social Share**: Zalo, Facebook, LinkedIn
- **PDF Export**: Download như CV

### Privacy Settings
- **Public**: Ai cũng xem được
- **Private**: Chỉ owner đã chat mới xem
- **Hidden**: Chỉ mình xem

### Edit Mode
- Toggle edit mode cho owner của profile
- Inline editing cho các section
- Upload ảnh cover/avatar

---

## Data Schema

```typescript
interface WorkerPublicProfile {
  id: string;
  username?: string;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  headline?: string;
  bio?: string;
  location?: string;
  
  language_skills: {
    language: string;
    level: string;
    verified: boolean;
  }[];
  
  reliability_score: number;
  total_shifts: number;
  on_time_rate: number;
  average_rating: number;
  review_count: number;
  
  work_history: {
    restaurant_name: string;
    restaurant_logo?: string;
    role: string;
    shift_count: number;
    rating?: number;
    review?: string;
  }[];
  
  privacy: 'public' | 'private' | 'hidden';
  created_at: string;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/p/[username]/page.tsx` | Public profile page |
| `app/worker/[id]/page.tsx` | ID-based profile |
| `components/profile/worker-profile-view.tsx` | Main view component |
| `components/profile/hero-section.tsx` | Hero with cover/avatar |
| `components/profile/language-badges.tsx` | Language skills display |
| `components/profile/reliability-meter.tsx` | Score visualization |
| `components/profile/work-history.tsx` | Job history cards |
| `components/profile/share-menu.tsx` | Share options |
| `lib/services/profile.service.ts` | Profile data fetching |

---

## Design Tokens

```css
/* Colors */
--profile-gradient-start: #4F46E5;
--profile-gradient-end: #7C3AED;

/* Spacing */
--hero-height: 200px;
--avatar-size: 120px;
--avatar-border: 4px solid white;

/* Typography */
--name-size: 2rem;
--headline-size: 1rem;
```
