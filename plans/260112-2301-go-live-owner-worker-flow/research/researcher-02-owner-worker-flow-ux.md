# Owner-Worker Operational Flow UX Research

**Date:** 2026-01-12 | **Status:** Research Complete | **Focus:** Gig Economy Hospitality Platforms

---

## Executive Summary

Tapy's Owner-Worker flow succeeds when it prioritizes **transparency, real-time communication, and friction-free interactions**. Core principle: eliminate ambiguity at every touchpoint. Workers need instant confirmation; owners need accountability visible upfront.

---

## 1. Simplified Onboarding Flows

### Worker Onboarding (Day 0-3)
- **Pre-registration email:** Clear "what to expect" + timeline (5 min read)
- **Mobile-first setup:** Language cert upload → Bank details → Profile photo (3 steps, skip-able)
- **First job guidance:** Tutorial showing Instant Book vs Request-to-Book flow
- **Reliability intro:** Explain score penalties upfront (-20 for no-show shapes behavior early)

### Owner Onboarding (Day 0-1)
- **Restaurant setup wizard:** Logo + cover images → Location → Supported languages
- **Job posting template:** Pre-filled fields (role, rate, languages) speed creation
- **QR code generation:** Auto-generate + print-ready immediately
- **First application:** Show clear approval/rejection flow with reasoning

**Key:** Both sides need ONE clear path forward. Avoid multi-step confirmations.

---

## 2. Essential Communication Touchpoints

### Before Booking Accepted
- **Job posting clarity:** Requirements (language level, skills), pay, shift hours
- **Auto-match signal:** "You qualify for Instant Book" or "Request manual approval"
- **One-click apply:** No hidden steps; show what happens next

### Booking Confirmation (Critical)
- **Instant notification:** Push + SMS/email within 30 seconds
  - Approved: "Shift locked. QR code: [link]"
  - Pending: "Owner notified. Response within 24h"
- **Calendar sync:** Add to worker calendar; add to owner staffing board
- **No ambiguity:** Worker knows exact status (locked/pending/rejected)

### Pre-Shift (24-48h before)
- **Owner reminder:** "3 staff confirmed + 1 pending for Fri 10am shift"
- **Worker reminder:** "Your shift tomorrow 10am. Check-in via QR at 09:45"
- **Contingency signal:** If understaffed, owner can still REQUEST (not demand) alternatives

### Shift Day
- **Check-in window:** 15 min before shift (e.g., 9:45-10:00am)
- **Late detection:** Auto-flag if not scanned by shift start
- **Owner alert:** "Worker not checked in - contact now or mark no-show"

---

## 3. Booking Confirmation & Notification Patterns

### Confirmation States (Make Visible)
```
Instant Book → APPROVED (green) → Locked
Request Book → PENDING (yellow) → Notifying Owner
Request Book → REJECTED (red) → Closed
```

### Notification Cadence
| When | Recipient | Message | Channel |
|------|-----------|---------|---------|
| Booking approved | Worker | "Shift confirmed + QR" | Push + SMS |
| Booking pending | Owner | "[Worker Name] requesting shift" | Dashboard alert |
| Owner approval/reject | Worker | "Shift [approved/declined]" | Push + SMS |
| 24h before | Worker | "Reminder: Shift tomorrow" | Push + Email |
| 1h before | Worker | "Check-in opens in 1 hour" | Push only |
| Shift start | Owner | "3/4 workers checked in" | Dashboard |

**Principle:** No notification fatigue. Batch non-urgent alerts; prioritize critical actions.

---

## 4. Check-in/Check-out Best Practices

### QR Code System (Keep Simple)
- **Single QR per job posting** (not per worker)
- **Scanning location:** Physical poster at entrance OR in owner's phone
- **Offline mode:** Store QR locally; sync when online
- **UX:** 1-tap scan → instant confirmation ("Check-in recorded at 09:47")

### Geolocation Validation
- **Soft requirement:** Suggest location confirmation (don't block)
- **Fraud prevention:** Flag mismatches (worker at 100km away) for review
- **Privacy-first:** Collect location only during check-in window, auto-delete after shift

### Check-out Flow
- **Auto check-out:** Offer at shift end time + 30 min grace
- **Manual option:** Worker can manually check out early/late
- **Shift completion:** Immediately trigger reliability +1 update

### Edge Case: Late Check-in
- **0-15 min late:** Warn but allow check-in; -2 reliability points
- **15+ min late:** Require owner approval to accept (can still mark no-show)

---

## 5. Edge Cases & Resolution Patterns

### No-Show Protocol
1. **T+0:** Shift start time passes, no check-in
2. **T+5:** Auto-alert to owner: "No check-in. Confirm status?"
3. **T+10:** Auto-mark as no-show IF owner confirms
4. **Relief:** Worker gets -20 score + 7-day freeze
5. **Communication:** Auto-message worker: "Marked no-show. Appeal: [link]"

### Cancellation (Worker-Initiated)
- **Before T-6h:** No penalty, free cancellation
- **T-6h to T-1h:** -5 reliability points
- **T-1h to T+15min:** -15 points (serious commitment breach)
- **After T+15min:** Count as no-show (-20)

### Cancellation (Owner-Initiated)
- **Before T-24h:** Free cancellation, explain reason to worker
- **T-24h to T-1h:** Pay 50% cancellation fee to worker
- **T-1h onward:** Pay 100% shift rate to worker (auto-transferred)

### Late Arrival (>15 min)
1. Owner can **confirm acceptance** or **request different worker**
2. If accepted: Mild penalty (-2) + note on record
3. If rejected: Treated as no-show for arriving worker

### Communication Breakdown
- **Owner unresponsive:** Auto-approve Request-to-Book after 24h
- **Worker unresponsive:** Allow owner to re-request or move to next candidate
- **Platform issue:** Maintain offline mode; clear conflict resolution docs

---

## 6. Reliability Scoring Transparency

### Real-time Score Visibility
- **Worker:** See current score + last 10 transactions breakdown
- **Owner:** See worker score in booking flow ("Score: 98 (+1 complete, -2 late)")

### Score Recovery Path
- **After 7-day freeze:** Return with 80 points, earn back with good shifts
- **Appeal process:** Simple form for disputed no-shows (owner can override)

### Messaging
- Use simple language: "You're reliable (+1). Keep this up!"
- Avoid shame: Frame penalties as "accountability," not "punishment"

---

## Key Principles for Implementation

| Principle | What This Means |
|-----------|-----------------|
| **Clarity First** | One notification, one action, clear outcome |
| **Real-time > Batch** | Workers need instant shift confirmation |
| **Defaults > Choices** | Pre-select safest option; require active override for risks |
| **Transparent Penalties** | Show exactly why -20 points happened |
| **Owner Control** | Let owners decide on late arrivals, cancellations |
| **Worker Appeal** | Always allow dispute/context on score penalties |

---

## Unresolved Questions

1. What timeout is acceptable for "Request-to-Book" owner response before auto-approval? (Recommend: 24h)
2. Should workers see reason for rejection from owner? (Privacy vs transparency tradeoff)
3. How to handle partial shift cancellations (e.g., worker needed only 2h of 4h shift)?
4. Should reliability score reset monthly or annually?
5. What's penalty structure if owner marks worker no-show falsely?

---

## Sources

- [Communication in Gig Economy Characteristics, Tools, Challenges](https://theintactone.com/2025/09/13/communication-in-gig-economy-characteristics-tools-challenges/)
- [How to Onboard New Restaurant Employees Effectively](https://www.shiftforce.com/blog/how-to-onboard-new-restaurant-employees-effectively/)
- [How to Create an Effective Restaurant Onboarding Process](https://www.7shifts.com/blog/how-to-create-an-effective-restaurant-onboarding-process/)
- [The Gig Trap: Algorithmic, Wage and Labor Exploitation in Platform Work](https://www.hrw.org/report/2025/05/12/the-gig-trap/)
- [QR Codes for the Hospitality Industry](https://www.supercode.com/use-case/qr-codes-for-hospitality/)
- [How Hotels Can Use QR Codes to Simplify Check-In and Check-Out](https://bitly.com/blog/qr-codes-for-hotel-check-in-and-check-out/)
- [Best Restaurant Employee Scheduling Software in 2025](https://www.larksuite.com/en_us/blog/restaurant-employee-scheduling-software)
