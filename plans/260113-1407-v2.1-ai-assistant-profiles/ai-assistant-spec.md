# AI Virtual Assistant - Implementation Plan

## Tổng quan

AI Assistant giúp người dùng thực hiện mọi thao tác thông qua chat, không cần vào từng màn hình cấu hình.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  ┌─────────────────┐   ┌──────────────────────┐     │
│  │  Chat Component │───│  AI Action Executor  │     │
│  └────────┬────────┘   └──────────┬───────────┘     │
└───────────┼──────────────────────┼──────────────────┘
            │                      │
            ▼                      ▼
┌───────────────────┐    ┌──────────────────────┐
│  /api/ai/chat     │    │    Existing APIs     │
│  (Edge Function)  │    │  - Profile update    │
└────────┬──────────┘    │  - Job CRUD          │
         │               │  - Application       │
         ▼               └──────────────────────┘
┌───────────────────┐
│   Anthropic API   │
│  Claude 3.5 Sonnet│
└───────────────────┘
```

---

## Function Definitions

### Worker Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `update_profile` | Cập nhật thông tin cá nhân | `{ full_name, phone, bio, bank_info }` |
| `add_language_skill` | Thêm kỹ năng ngôn ngữ | `{ language, level, certificate_url }` |
| `search_jobs` | Tìm kiếm job | `{ language, location, date_range, min_salary }` |
| `apply_to_job` | Ứng tuyển job | `{ job_id, message? }` |
| `get_my_schedule` | Xem lịch làm việc | `{ date_range? }` |
| `cancel_application` | Hủy đơn ứng tuyển | `{ application_id, reason }` |
| `get_profile_status` | Xem trạng thái profile | `{}` |

### Owner Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `create_job` | Tạo job mới | `{ title, description, shift_date, start_time, end_time, hourly_rate, language, level, slots }` |
| `update_job` | Chỉnh sửa job | `{ job_id, updates }` |
| `list_applications` | Xem đơn ứng tuyển | `{ job_id?, status? }` |
| `approve_application` | Duyệt ứng viên | `{ application_id }` |
| `reject_application` | Từ chối ứng viên | `{ application_id, reason? }` |
| `update_restaurant` | Cập nhật nhà hàng | `{ name, description, address, images }` |
| `get_job_stats` | Xem thống kê | `{ date_range? }` |

---

## System Prompt

```
Bạn là Tapy AI - trợ lý ảo của ứng dụng Tapy, nền tảng kết nối nhà hàng Nhật/Hàn với nhân viên part-time.

Vai trò của bạn:
- Giúp người dùng thực hiện các tác vụ một cách nhanh chóng
- Điền form hộ người dùng thông qua hội thoại tự nhiên
- Giải thích các tính năng và quy định

Quy tắc:
1. Luôn xác nhận trước khi thực hiện action quan trọng (tạo job, ứng tuyển, hủy đơn)
2. Cảnh báo người dùng về penalty khi hủy đơn muộn
3. Nếu thiếu thông tin, hỏi từng bước một, không hỏi quá nhiều cùng lúc
4. Trả lời ngắn gọn, thân thiện, bằng tiếng Việt
5. Nếu không thể thực hiện action, giải thích lý do và hướng dẫn người dùng

Thông tin user hiện tại:
- Vai trò: {role}
- Tên: {full_name}
- Profile: {profile_json}
```

---

## API Endpoint

### POST /api/ai/chat

```typescript
// Request
{
  messages: [
    { role: 'user', content: 'Tôi muốn tạo job mới' },
    { role: 'assistant', content: '...' }
  ],
  context: {
    userId: string,
    role: 'worker' | 'owner',
    currentPage: string
  }
}

// Response
{
  message: string,
  actions?: [
    {
      type: 'function_call',
      function: 'create_job',
      arguments: { ... },
      status: 'pending' | 'executed' | 'failed'
    }
  ],
  suggestions?: string[]
}
```

---

## Chat UI Component

### Features
- Floating button góc phải màn hình
- Expand thành chat panel
- Full-screen trên mobile
- Message history (localStorage + DB)
- Typing indicator
- Quick action chips
- Rich message types (text, card, confirmation)

### States
1. **Collapsed**: Chỉ hiện bubble + unread count
2. **Expanded**: Chat panel với messages
3. **Full-screen**: Trên mobile
4. **Loading**: Khi đang xử lý action

---

## Confirmation Flow

Với các action quan trọng, AI sẽ:

1. **Show Summary**: Tóm tắt action sẽ thực hiện
2. **Ask Confirmation**: "Bạn có chắc muốn [action]?"
3. **Execute**: Gọi function nếu user đồng ý
4. **Report Result**: Thông báo kết quả

Ví dụ:
```
User: Tôi muốn hủy đơn ứng tuyển job ABC

AI: ⚠️ Lưu ý: Job này bắt đầu trong 3 giờ nữa. 
    Nếu hủy bây giờ, bạn sẽ bị trừ 5 điểm reliability.
    
    Bạn có chắc muốn hủy không?
    
    [Hủy đơn] [Giữ nguyên]

User: [Hủy đơn]

AI: ✅ Đã hủy đơn ứng tuyển job ABC.
    Điểm reliability mới: 80 (-5)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/api/ai/chat/route.ts` | API endpoint |
| `lib/ai/assistant.ts` | AI logic + function calling |
| `lib/ai/functions.ts` | Function definitions |
| `lib/ai/prompts.ts` | System prompts |
| `components/ai/chat-bubble.tsx` | Floating button |
| `components/ai/chat-panel.tsx` | Chat interface |
| `components/ai/message.tsx` | Message component |
| `components/ai/action-card.tsx` | Confirmation cards |
| `hooks/use-ai-chat.ts` | Chat state management |

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
# Or
OPENAI_API_KEY=sk-...
```

---

## Cost Optimization

1. **Context Limit**: Chỉ gửi 10 messages gần nhất
2. **Caching**: Cache system prompt
3. **Streaming**: Stream response để UX tốt hơn
4. **Token Counting**: Monitor usage

---

## Error Handling

| Error | User Message |
|-------|--------------|
| API timeout | "Xin lỗi, hệ thống đang bận. Vui lòng thử lại." |
| Function failed | "Không thể thực hiện [action]. Lý do: [error]" |
| Missing permission | "Bạn cần hoàn thiện profile trước khi [action]" |
| Rate limit | "Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ..." |
