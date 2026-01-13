# Release Notes - v2.0.0

**Release Date:** 2026-01-13

---

## 🚀 Major Features

### Go-Live Ready
Tapy is now production-ready with complete Owner-Worker marketplace flow.

### Phase 1: Pre-Launch Validation
- ✅ **97 unit tests** covering all critical paths
- ✅ Job Matching algorithm tests (25+ cases)
- ✅ QR Code security tests (15+ cases)  
- ✅ Reliability scoring tests (16+ cases)
- ✅ RLS Policy audit documentation (22 cases)

### Phase 2: Soft Launch Features
- ✅ **Shift Reminders** - 24h and 1h before shift notifications
- ✅ **Tiered Cancellation Penalties** - Fair penalty system based on timing
- ✅ **Monitoring Dashboard** - Real-time KPIs at `/admin/monitoring`
- ✅ **Onboarding Materials** - Vietnamese guides for Owners and Workers

### Phase 3: Production Launch
- ✅ **Production Checklist** - Complete deployment guide
- ✅ **Cron API** - Automated reminder processing
- ✅ **FAQ Page** - Comprehensive user support at `/faq`
- ✅ **Status Page** - System health monitoring at `/status`
- ✅ **Product Guide** - Detailed usage guide at `/guide`

---

## 📱 New Pages

| Route | Description |
|-------|-------------|
| `/guide` | Product usage guide (Worker/Owner) |
| `/faq` | Frequently asked questions |
| `/status` | System status page |
| `/admin/monitoring` | KPI monitoring dashboard |

---

## 🔧 Technical Improvements

### Database
- Migration 019: Reminder and cancellation tracking
- New DB functions for shift reminder queries

### Services
- `reminder.service.ts` - Shift reminder processing
- `cancellation.service.ts` - Tiered penalty logic

### API
- `/api/cron/reminders` - Vercel Cron endpoint

---

## 📊 Test Coverage

```
Test Suites: 5 passed
Tests:       97 passed
Build:       ✅ Success
```

---

## ⚙️ Configuration Required

Before deploying to production:

1. **Environment Variables:**
   - `QR_SECRET` - Unique production value (REQUIRED)
   - `SUPABASE_SERVICE_ROLE_KEY` - For cron jobs
   - `CRON_SECRET` - Optional auth for cron

2. **Vercel Cron:** Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/reminders",
       "schedule": "0/15 * * * *"
     }]
   }
   ```

3. **Database:** Run migrations 001-019

---

## 📝 Documentation

- [Product Documentation](./docs/PRODUCT_DOCUMENTATION.md)
- [Production Checklist](./docs/production-checklist.md)
- [E2E Testing Checklist](./plans/260112-2301-go-live-owner-worker-flow/e2e-testing-checklist.md)

---

## 🔜 Roadmap

- v2.1: Push notifications (FCM)
- v2.2: SMS reminders
- v3.0: Wallet & payment integration
