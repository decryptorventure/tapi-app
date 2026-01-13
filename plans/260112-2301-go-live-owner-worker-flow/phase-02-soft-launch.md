# Phase 2: Soft Launch (Closed Beta)

## Context

- [Main Plan](./plan.md)
- [Phase 1: Pre-Launch Validation](./phase-01-pre-launch-validation.md)
- [Research: Marketplace Go-Live](./research/researcher-01-marketplace-golive.md)
- [Research: Owner-Worker Flow UX](./research/researcher-02-owner-worker-flow-ux.md)

## Overview

2-week closed beta with trusted partners. Validate both sides of marketplace simultaneously. Week 1: 10-15 restaurants + 50-100 workers. Week 2: expand if metrics healthy.

## Key Insights

1. **Run parallel to manual booking** - restaurants maintain backup during beta
2. **University students = reliable test workers** - language school referrals valuable
3. **Daily metric reviews** - catch issues before they compound
4. **Video tutorials** - reduce QR scanning errors for first-time workers

---

## Requirements

### R1: Partner Recruitment

**Target: Week 1 Beta**
- 10-15 Japanese/Korean restaurants in HCMC
- Focus on existing relationships (known quantity)
- Criteria: willing to test, can provide feedback, has multiple shifts/week

**Worker Pool**
- 50-100 workers with verified language skills
- Source: university Japanese/Korean language departments
- Mix of JLPT N3-N5, TOPIK 3-6 levels

### R2: Onboarding Materials

**Owner Onboarding (Day 0-1)**
- [ ] Setup wizard walkthrough document (Vietnamese)
- [ ] Job posting guide with screenshots
- [ ] QR code printing instructions (A4 poster template)
- [ ] Support contact (WhatsApp/Zalo group)

**Worker Onboarding (Day 0-3)**
- [ ] Mobile app installation guide
- [ ] Profile setup: cert upload, bank details, photo
- [ ] Instant Book vs Request to Book explainer
- [ ] QR scanning tutorial (30-second video)
- [ ] Reliability score explanation

### R3: Monitoring Dashboard

**Real-Time Metrics (First 48h)**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Instant Book success rate | >70% | <50% |
| Check-in first attempt success | >90% | <80% |
| No-show rate | <5% | >10% |
| Owner approval rate (Request-to-Book) | 40-60% | <30% or >80% |
| QR scan failures | <5% | >10% |
| API response time (p95) | <500ms | >1s |

**Daily KPI Review**
- Supply: active workers, avg reliability score
- Demand: jobs posted, fill rate
- Quality: rejection rate, cancellation rate
- Engagement: DAU, time-to-match

### R4: Feedback Collection

**Owner Feedback (Weekly)**
- [ ] Job creation friction points
- [ ] Application review workflow issues
- [ ] QR scanning experience
- [ ] Worker quality assessment

**Worker Feedback (Weekly)**
- [ ] Job discovery experience
- [ ] Booking confirmation clarity
- [ ] QR check-in issues
- [ ] Score transparency questions

**Method:** Google Form + WhatsApp/Zalo group discussions

### R5: Issue Escalation Protocol

**Critical (Immediate)**
- Check-in system down (all workers locked out)
- Instant-book >30% false positives
- Data breach or RLS failure

**High (Within 4h)**
- No-show rate spike >10%
- QR generation failures
- Notification delivery <50%

**Medium (Within 24h)**
- UI bugs affecting usability
- Performance degradation
- Minor scoring inaccuracies

**Response Team**
- Technical: Developer on-call
- Operations: Ops lead in WhatsApp group
- Escalation: Daily standup review

### R6: Notification Implementation

**Phase 2 Must-Have**
- [ ] In-app notification system (toast + badge)
- [ ] Booking confirmation notification
- [ ] Shift reminder (24h + 1h before)
- [ ] Check-in success confirmation

**Phase 2 Nice-to-Have**
- [ ] SMS fallback (Twilio/Vietnam gateway)
- [ ] Push notifications (FCM)
- [ ] Owner alert for no check-in

---

## Related Code Files

| Purpose | Path |
|---------|------|
| Job Matching | `/lib/job-matching.ts` |
| Check-in Service | `/lib/services/checkin.service.ts` |
| Owner Dashboard | `/app/owner/dashboard/page.tsx` |
| Worker Feed | `/app/worker/feed/page.tsx` |
| QR Scanner | `/app/owner/scan-qr/page.tsx` |

---

## Implementation Steps

### Week 1: Closed Beta Launch

**Day 1-2: Partner Onboarding**
1. Contact 15 restaurants, confirm 10-12 participation
2. Send onboarding materials via email/Zalo
3. Help owners create first job posting
4. Verify QR code generation working

**Day 3-4: Worker Onboarding**
1. Post in university language groups
2. Guide through profile setup
3. Verify language cert uploads
4. First 50 workers complete onboarding

**Day 5-7: First Shifts**
1. Monitor first 20 bookings
2. Attend 2-3 check-ins in person (observe QR scan)
3. Collect immediate feedback
4. Fix critical bugs same-day

### Week 2: Expanded Beta

**Day 8-10: Scale Check**
1. Review Week 1 metrics
2. If healthy: recruit 20 more restaurants
3. Expand worker pool to 200
4. Implement high-priority fixes from feedback

**Day 11-14: Production Readiness**
1. Stress test with increased load
2. Finalize notification system
3. Document all known issues
4. Prepare Phase 3 launch checklist

---

## Todo List

- [ ] Recruit 10-15 restaurant partners
- [ ] Create owner onboarding materials (Vietnamese)
- [ ] Create worker onboarding materials (Vietnamese)
- [ ] Design QR poster template (A4)
- [ ] Setup monitoring dashboard (Supabase/custom)
- [ ] Create WhatsApp/Zalo support group
- [ ] Prepare feedback Google Forms
- [ ] Onboard 50-100 workers
- [ ] Monitor first 20 shifts in person
- [ ] Daily metric review for 14 days
- [ ] Implement in-app notification system
- [ ] Fix all critical bugs before Phase 3

---

## Success Criteria

| Metric | Target | Week 1 | Week 2 |
|--------|--------|--------|--------|
| Restaurants onboarded | 10-15 | 10 | 15 |
| Workers active | 50-100 | 50 | 100 |
| Instant-book success | >70% | TBD | TBD |
| Check-in success | >90% | TBD | TBD |
| No-show rate | <5% | TBD | TBD |
| Critical bugs | 0 | TBD | 0 |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Low restaurant adoption | Medium | High | Offer incentives, personal onboarding |
| Workers don't understand QR | Medium | Medium | Video tutorial, in-person demo |
| Check-in failures spike | Medium | High | Offline fallback, manual override |
| No-show rate high | High | High | Enforce freeze, improve reminders |
| Notification not delivered | High | Medium | In-app fallback, SMS gateway |

---

## Cancellation/Penalty Refinement

Based on research, implement tiered penalties:

| Timing | Worker Cancellation Penalty |
|--------|---------------------------|
| Before T-6h | No penalty |
| T-6h to T-1h | -5 reliability points |
| T-1h to T+15m | -15 reliability points |
| After T+15m | No-show: -20 + 7-day freeze |

| Timing | Owner Cancellation |
|--------|-------------------|
| Before T-24h | No penalty, notify worker |
| T-24h to T-1h | Flag for review |
| After T-1h | Warn owner, compensate worker (future) |

---

## Next Steps

After Phase 2 complete with healthy metrics:
1. Finalize production environment
2. Complete notification system
3. Scale infrastructure (if needed)
4. Begin [Phase 3: Production Launch](./phase-03-production-launch.md)
