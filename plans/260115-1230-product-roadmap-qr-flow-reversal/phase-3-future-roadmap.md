---
title: "Phase 3: Future Roadmap Overview"
status: pending
effort: TBD
priority: P3
---

# Phase 3: Future Roadmap Overview

## Context Links
- [Main Plan](./plan.md)
- [Research: Strategic Product Plan](./research/researcher-01-research-folder-analysis.md)

## Overview

Strategic roadmap based on competitive analysis vs Timee (Japan) and Vietnam market requirements. This phase outlines future development directions post-QR flow completion.

## Strategic Pillars (from Research)

1. **Super-app Integration via Zalo** - 76M Vietnamese user base
2. **Automatic Legal Compliance** - eContract + digital signatures
3. **GenAI-Driven Operations** - Job matching, fraud detection, behavior prediction

---

## Roadmap Item 1: Zalo Mini App Integration

### Overview
Leverage Zalo's 76M Vietnamese users for rapid market penetration. Worker-focused mini app for job discovery and check-in.

### Key Features
- Job discovery feed within Zalo
- ZNS (Zalo Notification Service) for geo-alerts
- Seamless authentication via Zalo OAuth
- PWA fallback for full features

### Technical Considerations
- Zalo Mini App SDK integration
- Background location tracking limitations
- Cross-platform state sync (Zalo ↔ Native app)

### Timeline
- Research: 2 weeks
- MVP: 4-6 weeks
- Full launch: Month 6

### Unresolved Questions
- Zalo Mini App sandbox constraints for GPS?
- Feature parity with native app feasibility?

---

## Roadmap Item 2: E-Contract Compliance (Decree 337/2025)

### Overview
Mandatory electronic labor contracts by July 2026. Auto-generate, sign, and register contracts with government platform.

### Key Features
- Template-based contract generation
- Digital signature workflow (worker + owner)
- Tax withholding automation (10% ≥2M VND)
- Centralized registry API integration

### Technical Considerations
- eKYC verification (CCCD OCR + liveness)
- Digital signature library selection
- Government API connectivity
- VAT invoice auto-generation

### Timeline
- Legal review: 4 weeks
- MVP (template + signature): 8 weeks
- Registry integration: Target Q2 2026

### Compliance Requirements
- Decree 337/2025/ND-CP compliance
- Personal income tax withholding
- Electronic invoicing for merchants

---

## Roadmap Item 3: GenAI Features

### Overview
AI-powered features for job posting, matching, and fraud detection.

### Key Features

#### Magic Posting (GenAI Job Creation)
- Owner describes job in natural language
- AI generates: title, description, requirements, wage suggestion
- Vietnamese language model (PhoGPT or OpenAI)

#### Intelligent Matching
- Vector search for job recommendations
- Similarity based on work history, not keywords
- Predictive matching: suggest before search

#### Fraud Detection
- Deepfake detection in eKYC
- GPS spoofing pattern recognition
- Account duplication detection (CCCD/phone)

#### No-Show Prediction
- Weather, traffic, behavioral patterns
- Early warning → auto-trigger backup hiring

### Technical Considerations
- LLM API selection (OpenAI vs local PhoGPT)
- Vector database for embeddings (Pinecone/Supabase pgvector)
- ML pipeline for prediction models

### Timeline
- Magic Posting MVP: 4 weeks
- Vector matching: 6-8 weeks
- Fraud detection: Ongoing improvement

---

## Roadmap Item 4: Payment Integration

### Overview
Real-time automated payouts via MoMo/ZaloPay APIs.

### Key Features
- Instant payout after shift completion
- Salary advance option (fintech partnership)
- Transaction fee transparency (20-25%)
- Wallet balance and history

### Technical Considerations
- MoMo API integration
- ZaloPay API integration
- Payment escrow for dispute handling
- Automated reconciliation

### Timeline
- MoMo MVP: 4 weeks
- ZaloPay addition: 2 weeks
- Salary advance: Month 8+

---

## Roadmap Item 5: Enhanced Discipline System

### Overview
Behavior engineering via penalty scoring and recovery mechanisms.

### Current System (Implemented)
- Late check-in: -1 to -2 points
- No-show: -20 points + 7-day freeze
- Completion: +1 point

### Enhanced System (Future)
- Cancellation tiers:
  - >48h: 0 points (encouraged)
  - 4h-12h: 7 points
  - <4h: 10 points → 14-day ban
- No-show: Permanent termination + CCCD blacklist
- Recovery: 1 completed job = -1 penalty point
- Optional deposit: 50K VND for high-value jobs

### Timeline
- Enhanced cancellation: 2 weeks
- Blacklist system: 4 weeks
- Deposit feature: Month 6+

---

## Priority Matrix

| Feature | Business Value | Technical Effort | Priority |
|---------|---------------|------------------|----------|
| QR Flow Reversal | High | Low | P1 (Now) |
| GPS Check-in | High | Low | P2 (Next) |
| E-Contract | Critical (Legal) | High | P1 (Q2 2026) |
| Zalo Mini App | High | Medium | P2 |
| Magic Posting | Medium | Medium | P2 |
| Payment Integration | High | High | P2 |
| Fraud Detection | Medium | High | P3 |

---

## Success Metrics (Platform-wide)

### Merchant KPIs
- >80% fill-rate
- <15min job-to-hire time
- <5% cancellation rate

### Worker KPIs
- Daily/weekly engagement
- Repeat booking rate
- <2% fraud rate

### Platform KPIs
- GMV (Gross Merchandise Value)
- Take-rate %
- Market concentration in beachhead (D1/Binh Thanh)

---

## Unresolved Questions

1. Zalo Mini App background location feasibility?
2. Deposit mechanics user acceptance in cash-poor economy?
3. Decree 337 registry integration API availability?
4. Competitive positioning vs Facebook groups?
5. PhoGPT vs OpenAI for Vietnamese content generation?
