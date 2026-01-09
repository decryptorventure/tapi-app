# Hướng dẫn Setup Tapy Project

## Yêu cầu

- Node.js 18+ 
- npm hoặc yarn
- Tài khoản Supabase
- Google Maps API Key (cho tính năng địa chỉ)

## Bước 1: Install Dependencies

```bash
npm install
```

## Bước 2: Setup Supabase

1. Tạo project mới trên [Supabase](https://supabase.com)
2. Vào SQL Editor
3. Copy nội dung file `supabase/schema.sql`
4. Paste và execute trong SQL Editor
5. Lưu lại URL và API keys:
   - Project URL
   - Anon/Public key
   - Service Role key (cho server-side operations)

## Bước 3: Configure Environment Variables

Tạo file `.env.local` từ template:

```bash
cp .env.local.example .env.local
```

Điền các giá trị:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Bước 4: Setup Authentication

### Option 1: Supabase Auth (Recommended)

Supabase Auth đã được cấu hình trong schema. Bạn cần:

1. Enable Phone Auth trong Supabase Dashboard:
   - Authentication → Providers → Phone
   - Enable phone provider
   - Configure SMS provider (Twilio, MessageBird, etc.)

2. Setup Phone OTP:
   - Follow Supabase docs để config SMS provider
   - Test với số điện thoại thật

### Option 2: Clerk (Alternative)

Nếu muốn dùng Clerk:

1. Install Clerk:
```bash
npm install @clerk/nextjs
```

2. Setup Clerk Provider trong `app/layout.tsx`
3. Update auth hooks để dùng Clerk

## Bước 5: Run Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong browser.

## Bước 6: Verify Setup

1. ✅ Database tables đã được tạo
2. ✅ Authentication hoạt động
3. ✅ Có thể query jobs từ Supabase
4. ✅ PWA manifest được load

## Troubleshooting

### Lỗi Supabase Connection
- Kiểm tra URL và keys trong `.env.local`
- Đảm bảo RLS policies đã được setup đúng
- Check browser console cho CORS errors

### Lỗi TypeScript
```bash
# Regenerate types từ Supabase (nếu dùng Supabase CLI)
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

### Lỗi PWA
- Kiểm tra `next.config.js` đã có `withPWA`
- Service worker sẽ được generate sau khi build
- Test trên HTTPS (required cho PWA)

## Next Steps

1. **Thêm Seed Data**: Tạo script để seed sample jobs và users
2. **Setup i18n**: Cấu hình next-intl cho đa ngôn ngữ
3. **Implement Authentication Flow**: Tạo pages cho login/signup
4. **Add More Features**: 
   - QR code generation cho check-in
   - Reliability score calculation
   - Payment integration (mock)

## Production Deployment

### Vercel

1. Push code lên GitHub
2. Import project vào Vercel
3. Add environment variables trong Vercel dashboard
4. Deploy!

```bash
vercel --prod
```

### Environment Variables cần set trên Vercel:
- Tất cả variables từ `.env.local`
- Đảm bảo `NEXT_PUBLIC_APP_URL` trỏ đến production URL

## Cấu trúc Project

```
tapy-app/
├── app/                 # Next.js App Router
├── components/          # React components
├── hooks/              # Custom hooks
├── lib/                # Utilities & services
│   ├── supabase/       # Supabase client
│   ├── services/       # Business logic
│   └── job-matching.ts # Core matching algorithm
├── types/              # TypeScript types
├── supabase/           # Database schema
└── public/             # Static assets
```

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/UI](https://ui.shadcn.com)

