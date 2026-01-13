# E2E Flow Testing Checklist

## Overview
Manual end-to-end testing for Owner and Worker flows before Go-Live.

---

## 🏪 Owner Flow

### Job Creation
- [ ] Navigate to `/owner/jobs/new`
- [ ] Fill all required fields:
  - Title
  - Description
  - Shift date/time
  - Hourly rate
  - Required language + level
  - Min reliability score
- [ ] Upload restaurant cover images
- [ ] Submit → Job created with status "open"

### Application Management
- [ ] Navigate to `/owner/jobs`
- [ ] Click on a job → View applications
- [ ] Verify pending applications listed
- [ ] Click **Duyệt** (Approve) → Status changes to "approved"
- [ ] Click **Từ chối** (Reject) → Status changes to "rejected"
- [ ] Verify worker receives notification

### QR Check-in Scanning
- [ ] Navigate to `/owner/scan-qr`
- [ ] Scan worker's QR code
- [ ] Verify check-in recorded
- [ ] Verify time displayed (on-time vs late)

### No-Show Processing
- [ ] Find approved application (worker didn't check-in)
- [ ] Click **Vắng mặt** (No-show)
- [ ] Verify worker loses -20 points
- [ ] Verify worker account frozen for 7 days

---

## 👷 Worker Flow

### Job Browsing
- [ ] Navigate to `/worker/feed`
- [ ] Verify only "open" jobs displayed
- [ ] Test language filter
- [ ] Test location filter
- [ ] Verify Instant Book badge on qualifying jobs

### Job Application
- [ ] Click on job → View details
- [ ] If qualified for Instant Book:
  - [ ] Click **Nhận ngay** → Immediate approval
  - [ ] QR code generated
- [ ] If Request-to-Book:
  - [ ] Click **Gửi đơn** → Status "pending"
  - [ ] Wait for owner approval

### QR Code Display
- [ ] Navigate to `/worker/jobs/[id]/qr` (or via dashboard)
- [ ] Verify QR code displayed
- [ ] Verify expiration time shown

### Chat with Owner
- [ ] After applying, open chat
- [ ] Send message → Message appears
- [ ] Verify owner receives notification

### Check-in
- [ ] Show QR code to owner
- [ ] Owner scans → Check-in recorded
- [ ] Verify reliability score updated:
  - On-time: +1
  - Late 15-30 min: -1
  - Late 30+ min: -2

### Job Completion
- [ ] After shift, owner marks complete
- [ ] Verify +1 reliability point
- [ ] Verify application status → "completed"

---

## 🔔 Notifications

### Triggers to Test
- [ ] Worker applies → Owner gets "Ứng viên mới"
- [ ] Owner approves → Worker gets "Cập nhật ứng tuyển"
- [ ] Owner rejects → Worker gets "Cập nhật ứng tuyển"
- [ ] Send chat message → Recipient gets "Tin nhắn mới"

### Notification Bell
- [ ] Badge shows unread count
- [ ] Click → Dropdown shows notifications
- [ ] Click notification → Navigate to related item
- [ ] "Mark all as read" works

---

## 🔒 Security Tests

### RLS Verification
- [ ] Owner A cannot see Owner B's jobs
- [ ] Worker cannot see other workers' applications
- [ ] Chat messages only visible to participants
- [ ] Notifications isolated per user

### QR Security
- [ ] Expired QR rejected
- [ ] Tampered QR rejected
- [ ] Duplicate scan blocked

---

## 📱 Mobile Responsiveness

- [ ] Job feed works on mobile
- [ ] Job detail page scrollable
- [ ] QR code scannable on mobile screen
- [ ] Chat window usable on mobile
- [ ] Notification bell accessible

---

## Test Accounts Needed

| Role | Email | Purpose |
|------|-------|---------|
| Owner A | owner-a@test.com | Primary owner testing |
| Owner B | owner-b@test.com | Cross-owner isolation test |
| Worker A | worker-a@test.com | Primary worker testing |
| Worker B | worker-b@test.com | Cross-worker isolation test |
| Worker C | worker-c@test.com | No-show testing |

---

## Sign-off

| Area | Tester | Date | Status |
|------|--------|------|--------|
| Owner Flow | | | ⬜ |
| Worker Flow | | | ⬜ |
| Notifications | | | ⬜ |
| Security | | | ⬜ |
| Mobile | | | ⬜ |
