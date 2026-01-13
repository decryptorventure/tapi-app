# Research Report: Two-Sided Marketplace Go-Live Best Practices
## Focus: Restaurant Labor + Gig Worker Marketplaces

**Date:** 2026-01-12 | **Status:** MVP Go-Live Planning | **Target:** Tapy Platform

---

## Executive Summary

Two-sided marketplace go-lives succeed when ops flows are validated before launch. Critical gap: owner-worker interaction under real load. Industry data shows labor marketplaces fail most on **trust mechanics** (verification), **demand matching** (qualification algorithms), and **reliability scoring** accuracy. Tapy's strengths—instant-book with language verification + reliability scoring—address core pain points. Go-live risks: unqualified workers auto-booked, owners losing confidence; workers matched to unsuitable jobs; check-in data unreliability undermining scoring system.

**Pre-launch priorities:** (1) Stress-test instant-book algorithm with 100+ edge cases, (2) Validate QR check-in under poor network, (3) Run 2-week soft launch with 10-15 restaurant + 50-100 workers, (4) Monitor key metrics: instant-book approval rate, no-show rate, owner rejection rate, check-in success rate.

---

## 1. Pre-Launch Validation Checklist

### Must-Validate Before Day 1

- **Instant Book Engine**
  - Edge cases: expired language certs, updated scores, frozen accounts
  - False positives/negatives: too lenient (bad workers book) vs. too strict (no available workers)
  - Performance: <200ms matching on 1000+ workers

- **Owner Dashboard Workflows**
  - Job creation → application review → approval → QR generation
  - Bulk operations for recurring shifts
  - Communication with workers (notifications, messaging)

- **Worker Job Discovery**
  - Feed relevance: language match, location, time
  - Filter performance under high job volumes
  - Swipe actions, wishlist, notifications

- **Check-In System** (Most Critical)
  - QR scanning offline fallback
  - GPS accuracy validation (5G/4G/weak signal)
  - Timestamp reliability for scoring
  - Retry logic for network failures

- **Payment/Wallet** (If launching with it)
  - Test payment rails, especially Vietnam VND
  - Simulate failures, refunds, disputes
  - Owner payout timing accuracy

### Database & Performance

- RLS policies: Confirm data isolation by role (owner can't see other owner jobs)
- Query performance: Job feed <1s load, application list <500ms
- Supabase limits: Storage growth, concurrent users, rate limits
- Backup & recovery tested

---

## 2. Critical Operational Flows to Validate

### Owner-Side Flow
```
Job Posted → Language/Level Set → Qualification Rules Locked
           ↓
        Worker Applies
           ↓
Instant-Book? Yes → Auto-Approve + QR Gen → Notification to Worker
            No  → Manual Review → Owner Decision → QR Gen or Reject
           ↓
Worker Checks In (QR Scan)
           ↓
Work Period
           ↓
Worker Checks Out (QR Scan)
           ↓
Reliability Score Updated
           ↓
Owner Rate Worker (Optional)
```

**Edge Cases to Test:**
- Worker applies 2 mins before job start (instant book, then no-show)
- Owner cancels job after auto-approval
- Check-in fails, worker retries at job end
- Worker quits mid-shift (incomplete check-out)

### Worker-Side Flow
```
Browse Feed (language-filtered)
           ↓
View Job Details (req language, location, time, owner rating)
           ↓
Check Qualifications (instant-book eligible?)
           ↓
Apply → Auto-Approved or Pending
           ↓
Get QR Code + Notification
           ↓
Navigate to Location (maps integration)
           ↓
Check-In (QR scan or fallback)
           ↓
Work
           ↓
Check-Out (QR scan)
           ↓
Earn Reliability Point
```

**Failure Paths:**
- Notification doesn't arrive (check FCM setup)
- QR doesn't generate (test PDF generation, storage)
- Check-in times incorrect (timezone handling, clock sync)

---

## 3. Restaurant Labor Marketplace Pain Points & Mitigation

| Pain Point | Industry Norm | Tapy's Risk | Mitigation |
|-----------|---------------|------------|-----------|
| **Labor Turnover** | 75%+ annual | High no-show rate | Reliability scoring + freeze on abusers |
| **Demand Unpredictability** | ±30% daily variance | Mismatch = unmet shifts | Owner can bulk-post recurring, workers see "trusted" status |
| **Cost Per Hire** | $2-5K per trained worker | Quality workers disappear | Language verification + verified reviews |
| **Skill Mismatches** | Wrong role, untrained | Auto-book wrong level | Test algorithm with non-JLPT workers (false positives) |
| **Communication Gaps** | Fragmented tools | Owner ≠ worker clarity | In-app notifications + chat (Phase 2) |

---

## 4. Minimum Viable Features for Launch

**Core (Live Day 1):**
- Worker job discovery feed with language filter
- Instant Book + Request to Book flows
- QR check-in/out system
- Reliability scoring (updated post-shift)
- Owner job management & approval dashboard

**Should Have (Week 1-2):**
- Basic notifications (job approved, check-in reminder)
- Worker profile with JLPT/TOPIK certs visible to owners
- Owner 1-click rejection with reason
- Check-in QR fallback (manual entry of code)

**Nice-to-Have (Post-MVP):**
- In-app messaging
- Repeat booking history
- Owner ratings visible to workers
- Bulk job scheduling
- Payment/wallet integration

---

## 5. Go-Live Monitoring & Success Metrics

### Real-Time Dashboards (First 48 Hours)

| Metric | Target | Action If Failed |
|--------|--------|-----------------|
| Instant Book Success Rate | >70% | Check algorithm false-positive rate |
| Check-In Success (1st attempt) | >90% | Debug QR/GPS, test offline fallback |
| No-Show Rate | <5% | Check notifications, worker reliability |
| Owner Approval Rate | 40-60% | If <40%, instant-book too strict |
| Notification Delivery | >95% | FCM health check |
| API Response Time (p95) | <500ms | Supabase scaling, query optimization |

### Week 1 KPIs

- **Supply-Side:** Active workers, language cert coverage, avg reliability score
- **Demand-Side:** Jobs posted, fill rate, repeat owner rate
- **Quality:** Owner rejection rate, worker cancellation rate, dispute rate
- **Engagement:** Daily active users, time-to-match, job discovery conversion

### On-Call Protocols

- **Critical Alert:** Check-in system fails (all workers locked out)
- **High Alert:** Instant-book >30% false positives (bad workers booking)
- **Medium Alert:** >10% no-show rate spike
- **Regular Check:** Daily morning review of overnight metrics

---

## 6. Soft Launch Strategy (Recommended)

**Week 1: Closed Beta (10-15 restaurants + 50-100 trusted workers)**
- Run in parallel with manual booking
- Owners: Japanese restaurant partners, known quantity staff
- Workers: University students, language school referrals
- Measure: Instant-book accuracy, check-in reliability, feedback collection

**Week 2: Expanded Beta (50+ restaurants + 500 workers)**
- Open to broader restaurant chains
- Worker onboarding: video tutorials for QR scanning
- Daily huddles with ops team to catch issues
- Monitor for edge cases: time zones, network issues, fraud

**Day 21: Production Launch**
- Scale to full marketplace
- Maintain 24/7 on-call for critical issues
- Continue daily metric reviews for 30 days

---

## 7. Risk Mitigation Priority Map

| Risk | Likelihood | Impact | Pre-Launch Test |
|------|-----------|--------|-----------------|
| Instant-book books unqualified workers | HIGH | CRITICAL | Run 100 edge cases, A/B test thresholds |
| Check-in GPS fails in urban canyons | MEDIUM | HIGH | Test in 10 restaurant locations |
| Reliability score wrong (causes trust loss) | MEDIUM | CRITICAL | Validate scoring logic with 50 test shifts |
| No-shows spike (owners leave platform) | HIGH | HIGH | Implement freeze system, test notifications |
| Payments fail (worker churn) | LOW | CRITICAL | If launching with payments, 10x test |
| Database RLS data leak | LOW | CRITICAL | Penetration test, audit policies |

---

## Key Takeaways

1. **Instant-book algorithm is your core differentiator—over-test it.** False positives destroy owner trust; false negatives kill worker opportunities.

2. **Check-in system is your reliability source of truth.** If timestamps are wrong, scoring is wrong. Test offline scenarios aggressively.

3. **No-show rate is your canary metric.** If >5% at launch, you have a worker quality or notification problem—fix immediately.

4. **Soft launch validates both sides simultaneously.** Restaurant owners and workers have different failure modes; don't skip this phase.

5. **Monitoring > Perfection.** Launch with 80% solution but 100% observability. Catch issues early, iterate weekly.

---

## Unresolved Questions

- How will language verification work for workers without formal JLPT/TOPIK certs? (e.g., self-taught workers)
- Payment model: Is Tapy taking commission? If so, what % and when does owner/worker see deduction?
- Worker appeal process: If frozen for no-show, how do they regain trust?
- Dispute resolution: Owner says worker didn't show, worker disputes—who adjudicates?
- Geographic expansion: Launching in Hanoi only or nationwide? Affects soft launch scope.

---

## Sources

- [How to Plan and Launch an MVP: Ultimate Guide for 2025](https://spdload.com/blog/how-to-launch-an-mvp/)
- [MVP for Two-sided Marketplace: Common Hurdles and How to Build a Solid Platform](https://www.nan-labs.com/v4/blog/two-sided-marketplace-mvp-development/)
- [MVP Social Marketplace Launch Checklist](https://fleexy.dev/blog/mvp-social-marketplace-launch-checklist/)
- [How to design a two-sided marketplace transaction flow - Dittofi](https://www.dittofi.com/learn/how-to-design-a-two-sided-marketplace-transaction-flow)
- [Gig Economy Reliability Metrics: Optimizing Contingent Workforce Management](https://www.myshyft.com/blog/freelancer-reliability-metrics/)
- [Optimize Restaurant Labor With Industry-Specific Shift Management](https://www.myshyft.com/blog/restaurant-labor-optimization/)
- [Top 10 Pain Points for Restaurant Owners (and How to Solve Them)](https://www.fb101.com/top-10-pain-points-for-restaurant-owners-and-how-to-solve-them/)
