# Production Deployment Checklist

## Pre-Deployment

### Environment Variables

| Variable | Required | Status |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ⬜ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ⬜ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ⬜ |
| `QR_SECRET` | ✅ (unique prod value) | ⬜ |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | ⬜ |

### Database

- [ ] Production Supabase project created
- [ ] Schema deployed (`/supabase/schema.sql`)
- [ ] All migrations applied (001-019)
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Connection pooling enabled
- [ ] Daily backup configured

### Infrastructure

- [ ] Domain configured (tapy.vn)
- [ ] SSL certificate active
- [ ] Vercel production deployment verified
- [ ] Edge caching configured

---

## Verification Steps

### Step 1: Database Check

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Step 2: QR System Test

```typescript
// Test with production QR_SECRET
import { QRCodeService } from '@/lib/services/qr-code.service';

const qr = await QRCodeService.generateQRText(
  'test-app-id',
  'test-worker-id', 
  'test-job-id',
  new Date(Date.now() + 60 * 60 * 1000)
);

const result = QRCodeService.validateQRCode(qr);
console.assert(result.valid === true, 'QR validation failed');
```

### Step 3: API Smoke Test

| Endpoint | Method | Expected |
|----------|--------|----------|
| `/api/auth/session` | GET | 200 |
| `/worker/feed` | GET | 200 |
| `/owner/dashboard` | GET | 200 |
| `/admin/monitoring` | GET | 200 |

### Step 4: Feature Verification

- [ ] Owner can create job
- [ ] Worker can view job feed
- [ ] Worker can apply to job
- [ ] Instant Book works for qualified workers
- [ ] QR code generates after approval
- [ ] QR scan records check-in
- [ ] Notifications delivered
- [ ] Chat messages work

---

## Launch Day Protocol

### T-2 Hours
1. Final staging verification
2. Notify team of launch
3. Prepare rollback command

### T=0 Launch
1. Deploy to production
2. Run smoke tests
3. Enable monitoring alerts
4. Send launch announcement

### T+1 Hour
1. Check all key metrics
2. Review error logs
3. Address any critical issues

### T+6 Hours
1. First day review
2. Document issues
3. Plan overnight monitoring

### T+24 Hours
1. Full day 1 review
2. Community feedback collection
3. Prioritize day 2 fixes

---

## Rollback Procedure

### Triggers
- API error rate >10%
- Check-in failure >30 min
- Data integrity issue
- Security breach

### Steps
1. **Revert deployment**
   ```bash
   vercel rollback
   ```

2. **Notify users**
   - In-app banner: "System maintenance"
   - Status page: Degraded

3. **Investigate**
   - Check Vercel logs
   - Check Supabase logs
   - Identify root cause

4. **Fix and redeploy**
   - Deploy fix to staging first
   - Verify fix works
   - Deploy to production

---

## Monitoring Thresholds

| Metric | Target | Alert | Critical |
|--------|--------|-------|----------|
| Uptime | 99.5% | <99% | <98% |
| API p95 | <500ms | >800ms | >1s |
| Error rate | <1% | >2% | >5% |
| Instant Book rate | >70% | <60% | <50% |
| No-show rate | <5% | >8% | >10% |

---

## Support Readiness

- [ ] Zalo OA configured
- [ ] Email support@tapy.vn active
- [ ] FAQ page published
- [ ] Canned responses prepared
- [ ] On-call rotation scheduled

---

## Sign-off

| Area | Owner | Date | Status |
|------|-------|------|--------|
| Infrastructure | | | ⬜ |
| Database | | | ⬜ |
| Application | | | ⬜ |
| Monitoring | | | ⬜ |
| Support | | | ⬜ |
