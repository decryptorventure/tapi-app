# Phase 3: Production Launch

## Context

- [Main Plan](./plan.md)
- [Phase 1: Pre-Launch Validation](./phase-01-pre-launch-validation.md)
- [Phase 2: Soft Launch](./phase-02-soft-launch.md)
- [Research: Marketplace Go-Live](./research/researcher-01-marketplace-golive.md)

## Overview

Full marketplace go-live after successful 2-week soft launch. Scale to 50+ restaurants, 500+ workers. Maintain 24/7 monitoring for first 30 days.

## Key Insights

1. **Launch with 80% solution, 100% observability** - monitoring > perfection
2. **First 48 hours critical** - dedicate full attention to metrics
3. **Daily standup for 30 days** - catch issues before they compound
4. **No-show rate is canary metric** - if >5%, investigate immediately

---

## Requirements

### R1: Production Environment Checklist

**Infrastructure**
- [ ] Vercel production deployment verified
- [ ] Supabase production project (separate from staging)
- [ ] Environment variables configured:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `QR_SECRET` (unique production value)
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] Domain configured (tapy.vn or similar)
- [ ] SSL certificate active

**Database**
- [ ] Production schema deployed (`/supabase/schema.sql`)
- [ ] RLS policies verified
- [ ] Indexes created for all high-traffic queries
- [ ] Backup schedule configured (daily)
- [ ] Connection pooling enabled

### R2: Monitoring Setup

**Real-Time Dashboard**
- [ ] Vercel Analytics enabled
- [ ] Supabase dashboard for DB metrics
- [ ] Custom alerts for:
  - API response time >1s (p95)
  - Error rate >1%
  - Database connections >80%

**Key Metrics Dashboard**

| Metric | Target | Alert | Critical |
|--------|--------|-------|----------|
| Instant Book success | >70% | <60% | <50% |
| Check-in first attempt | >90% | <80% | <70% |
| No-show rate | <5% | >8% | >10% |
| API response (p95) | <500ms | >800ms | >1s |
| Uptime | 99.5% | <99% | <98% |
| Error rate | <1% | >2% | >5% |

### R3: On-Call Protocol

**First 48 Hours**
- Developer on-call 24/7
- Check dashboard every 2 hours
- Response time <30 min for critical

**Week 1-4**
- Daily metric review (morning)
- On-call rotation (8h shifts)
- Weekly retrospective

**Escalation Matrix**

| Severity | Response Time | Action |
|----------|--------------|--------|
| Critical | <15 min | Page developer, rollback if needed |
| High | <1h | Fix same day |
| Medium | <24h | Add to sprint |
| Low | <1 week | Backlog |

### R4: Rollback Plan

**Trigger Conditions**
- API error rate >10%
- Check-in system failure >30 min
- Data integrity issue detected
- Security breach confirmed

**Rollback Steps**
1. Revert Vercel deployment to last known good
2. Notify users via in-app banner
3. Investigate root cause
4. Deploy fix to staging first
5. Re-deploy after verification

### R5: User Communication

**Launch Announcement**
- [ ] In-app banner for existing beta users
- [ ] Email to waitlist (if any)
- [ ] Social media post (Facebook Vietnam)

**Support Channels**
- [ ] Zalo OA for customer support
- [ ] Email support@tapy.vn
- [ ] FAQ page on website

**Incident Communication**
- Status page (simple: up/down/degraded)
- In-app notification for outages >5 min

### R6: Scale Targets (30-Day)

| Metric | Week 1 | Week 2 | Week 4 |
|--------|--------|--------|--------|
| Restaurants | 50 | 100 | 200 |
| Active workers | 200 | 500 | 1000 |
| Jobs posted/week | 100 | 300 | 800 |
| Completed shifts/week | 50 | 200 | 500 |

---

## Related Code Files

| Purpose | Path |
|---------|------|
| All Services | `/lib/services/*.ts` |
| Database Schema | `/supabase/schema.sql` |
| App Entry | `/app/layout.tsx` |
| Owner Flow | `/app/owner/**/*.tsx` |
| Worker Flow | `/app/worker/**/*.tsx` |

---

## Implementation Steps

### Day -1: Final Preparation

1. Run full E2E test on staging
2. Verify all environment variables in Vercel
3. Test QR generation with production QR_SECRET
4. Confirm backup is working
5. Brief on-call team

### Day 0: Launch Day

**Morning (T-2h)**
1. Final staging verification
2. Deploy to production
3. Smoke test: create job, apply, generate QR
4. Enable monitoring alerts

**Launch (T=0)**
1. Remove beta restrictions
2. Send launch announcement
3. Monitor dashboard continuously
4. Respond to first user issues

**Evening (T+6h)**
1. Review first day metrics
2. Document any issues
3. Prioritize overnight fixes

### Day 1-7: Stabilization

1. Daily metric review at 9am
2. Fix any P1/P2 bugs same day
3. Collect user feedback actively
4. Adjust thresholds if needed

### Day 8-30: Growth Phase

1. Weekly metric review
2. Feature requests collection
3. Performance optimization
4. Plan Phase 2 features (payments, contracts)

---

## Todo List

- [ ] Configure production Supabase project
- [ ] Set all environment variables in Vercel
- [ ] Deploy schema to production database
- [ ] Verify RLS policies work in production
- [ ] Test QR system with production QR_SECRET
- [ ] Configure backup schedule
- [ ] Setup monitoring dashboard
- [ ] Create on-call rotation schedule
- [ ] Prepare launch announcement
- [ ] Setup Zalo OA support channel
- [ ] Create FAQ page
- [ ] Brief on-call team
- [ ] Run full E2E test on production
- [ ] Launch and monitor for 48h
- [ ] Daily standups for 30 days

---

## Success Criteria

| Metric | Day 1 | Week 1 | Month 1 |
|--------|-------|--------|---------|
| Uptime | 100% | 99.5% | 99.5% |
| Error rate | <1% | <1% | <0.5% |
| Instant Book success | >70% | >75% | >80% |
| No-show rate | <5% | <5% | <3% |
| User complaints | <10 | <20 | <50 |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Traffic spike crashes app | Low | Critical | Vercel auto-scaling, rate limits |
| Database connection exhausted | Medium | High | Connection pooling, query optimization |
| No-show rate spikes | High | High | Enforce penalties, improve notifications |
| Fraud/abuse attempts | Medium | High | Monitor unusual patterns, manual review |
| Support overwhelmed | Medium | Medium | FAQ, canned responses, prioritization |

---

## Post-Launch Roadmap (Phase 2+ Features)

**Month 2: Reliability**
- Push notifications (FCM)
- SMS fallback for critical alerts
- Improved offline QR support

**Month 3: Trust**
- E-contract signing
- Worker ratings from owners
- Dispute resolution system

**Month 4: Growth**
- Wallet & payment integration
- MoMo/ZaloPay payout
- Owner subscription plans

**Month 6: Scale**
- Hanoi expansion
- Advanced analytics dashboard
- API for enterprise partners

---

## Unresolved Questions

1. **Payment timeline:** When will payment integration be ready?
2. **Geographic scope:** HCMC only or nationwide launch?
3. **Fraud detection:** How to identify fake check-ins?
4. **Dispute resolution:** Who adjudicates owner-worker conflicts?
5. **Language cert expiry:** Auto-invalidate after 2 years?

---

## Next Steps After Launch

1. Celebrate launch with team
2. Continue daily monitoring for 30 days
3. Collect 100+ user feedback points
4. Prioritize Phase 2 features based on data
5. Plan Month 2 development sprint
