# Research Folder Analysis: Tapy Product Strategy Report

**Date:** 2026-01-15 | **Source:** `research/Kế Hoạch Phát Triển Sản Phẩm Tapy.docx` (Vietnamese)

---

## Executive Summary

Analyzed comprehensive Vietnamese strategic product plan for **Tapy**, a gig economy platform targeting Vietnam's informal labor market. Document provides detailed competitive analysis of Japanese market leader **Timee**, implementation roadmap, and monetization strategy.

---

## Key Strategic Pillars (3-Pillar Framework)

1. **Super-app Integration via Zalo** – Rapid market penetration using 76M Vietnamese Zalo users
2. **Automatic Legal Compliance** – eContract & digital signatures enabling secure short-term work
3. **GenAI-Driven Operations** – Agentic AI for job matching, fraud detection, behavior prediction

---

## Product Roadmap & Timelines

### Phase 1: MVP & Pilot (Months 1-6)
- Zalo Mini App (worker-focused) + Web Admin portal
- Basic eKYC and manual payouts
- Pilot: 1 HCMC district
- **Targets:** 100 merchants, 5K workers, >80% fill-rate

### Phase 2: Automation & Scale (Months 7-12)
- Native iOS/Android apps launch
- **GenAI job description generation** (Magic Posting)
- Real-time automated payout (MoMo/ZaloPay APIs)
- Expand to full HCMC + Hanoi
- **Targets:** 1K merchants, 50K workers, <5% no-show rate

### Phase 3: Ecosystem (Year 2+)
- Tapy Career Plus (permanent hiring conversion)
- Fintech partnerships (salary advances, micro-insurance)
- Advanced AI: predictive matching, fraud prediction

---

## Competitive Differentiation vs. Timee

| Feature | Timee | Tapy |
|---------|-------|------|
| **Platform** | Native app only | Zalo Mini App → Native hybrid |
| **KYC** | Age verification | eKYC + facial recognition + social links |
| **Contracts** | None emphasized | Automated e-contracts (Decree 337) |
| **Job posting** | Templates | GenAI-powered (Magic Posting) |
| **No-show penalty** | 14-day ban | Permanent blacklist + CCCD block |
| **Matching** | Geofence + filters | Geofence + vector search AI |

---

## Revenue Model

- **Transaction fee:** 20-25% (undercut Timee's 30%)
- **Premium posting:** Sticky ads, urgent postings
- **Value-added services:** Salary advances, accident insurance

---

## Core Technical Features

### Worker App (Tapy Worker)
- **Hyper-local job discovery:** Map-based UI, geofencing, smart push alerts (via ZNS)
- **eKYC on signup:** OCR for CCCD reading, liveness detection, AI fraud scoring
- **Dynamic trust profile:** Reliability score, skill badges, work history
- **Check-in/check-out:** Dynamic QR codes + GPS validation + WiFi fingerprinting
- **Instant payouts:** Connected to MoMo/ZaloPay APIs for real-time disbursement

### Merchant App (Tapy Biz)
- **GenAI job posting assistant:** Auto-generates JD, requirements, wage proposals
- **Auto-contract generation:** Digital signing workflow, tax compliance automation
- **2-way rating system:** Merchant-worker feedback loops
- **Blacklist management:** Per-merchant no-hire lists
- **Early warning system:** AI predicts no-show risk; auto-triggers backup hiring

---

## Behavior Engineering & Discipline System

**Penalty scoring escalation:**
- Cancel >48h: 0 points (encouraged)
- Cancel 4h-12h: 7 points
- Cancel <4h: 10 points → 14-day ban
- No-show: Permanent account termination + CCCD/phone blacklist

**Recovery mechanism:** Complete jobs to reduce penalty points (1 job = 1 point reduction)

**Optional deposit:** 50K VND hold for high-value/critical jobs; forfeited on no-show

---

## Market Insights

- **Vietnam pain points vs Japan:** Cash economy, informal labor, low-trust transactions, "giờ cao su" culture
- **Beachhead market:** District 1 & Binh Thanh (HCMC) or National University area (high worker density + heavy merchant demand)
- **Fill-rate saturation goal:** <15 min job-to-assignment time before expanding districts
- **Sales motion:** Door-to-door merchant outreach with "labor fill guarantee" (Tapy staff fills jobs if needed)

---

## Legal/Compliance Requirements

- **Decree 337/2025/NĐ-CP:** Mandatory electronic labor contracts effective July 2026
- **Personal income tax:** Auto-withhold 10% when earnings ≥2M VND/transaction
- **Electronic invoicing:** VAT invoices auto-generated for merchant transactions
- **Centralized contract registry:** API ready for national government platform

---

## AI/Automation Priorities

1. **GenAI for JD creation** (PhoGPT or OpenAI integration)
2. **Vector search matching** – Recommend similar jobs based on worker history (not keyword match)
3. **Fraud detection** – Deepfake detection, GPS spoofing prevention, account duplication
4. **No-show prediction** – Weather, traffic, behavioral patterns
5. **Auto-payroll calculation** – Tax withholding, VAT invoicing

---

## Success Metrics (Early Stage)

- **Merchant KPIs:** >80% fill-rate, <15min job-to-hire time, <5% cancellation rate
- **Worker KPIs:** Daily/weekly engagement, repeat booking rate, <2% fraud rate
- **Platform KPIs:** GMV, take-rate %, market concentration in beachhead

---

## Unresolved Questions

1. **Zalo Mini App limitations** – Background location tracking restricted; strategy relies on "last known location" + ZNS for geo-alerts. Feasibility under Zalo's sandbox constraints?
2. **Deposit mechanics** – 50K VND deposit controversial in cash-poor gig economy; user acceptance risk?
3. **Timee Japan labor arbitrage** – Does 2-4 week hiring cycle cited reflect pre-gig era? Modern SME hiring baselines?
4. **Regulatory tail risk** – Decree 337 requires centralized registry by July 2026; integration roadmap clarity needed.
5. **Competitive positioning vs. Facebook groups** – How to drive adoption over zero-friction but high-risk community hiring?

---

## Recommendations for Product Planning

- **Fast-track Phase 1 geofencing/ZNS + Phase 2 native app** transition (Zalo Mini bottleneck may limit long-term scaling)
- **Validate beachhead market saturation metrics** before national rollout
- **Legal review of penalty/deposit mechanics** under Vietnamese labor law
- **Pilot GenAI job posting** with 50-100 merchants to measure adoption vs. template approach
- **De-risk Timee assumptions** – validate 2-4 week hiring cycle with local merchant interviews

---

## Strategic Alignment

**This research document positions Tapy as:**
- A structural market maker (solving labor supply-demand fragmentation)
- A trust arbitrageur (digitizing informal sector confidence)
- A compliance enabler (automating regulatory burden for SMEs)

Success hinges on **execution discipline** (matching Timee's operational rigor) + **trust engineering** (eKYC, ratings, e-contracts) + **network density** (beachhead saturation before expansion).
