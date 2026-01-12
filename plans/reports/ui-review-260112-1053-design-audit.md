# UI/UX Design Audit Report

**Date:** 2026-01-12 | **Project:** Tapy - Just-in-Time Recruitment Platform

---

## Executive Summary

Reviewed 15+ key pages and components. Found **strong foundation** with design system variables, semantic colors, and utility classes. Identified **12 issues** across 4 categories requiring attention.

**Overall Score: 7.5/10** - Good foundation, needs consistency refinements.

---

## Strengths

| Area | Details |
|------|---------|
| Design System | Well-structured CSS variables in `globals.css` with semantic colors (primary, cta, success, warning) |
| Button Component | Comprehensive variants (default, cta, success, outline, ghost) with proper focus states |
| Utility Classes | Good `card-hover`, `interactive-hover`, `glass-card`, `focus-ring` utilities |
| Dark Mode | CSS variables properly set for dark mode (though not fully tested) |
| Accessibility Base | `prefers-reduced-motion` respected, focus-visible rings implemented |
| i18n Support | Consistent use of `useTranslation` hook across pages |

---

## Issues Found

### Category 1: Design System Inconsistency (Priority: High)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| DS-01 | `worker-nav.tsx:41` | Hardcoded colors (`bg-white`, `text-blue-600`, `text-slate-500`) instead of CSS variables | Breaks dark mode, inconsistent theming |
| DS-02 | `login/page.tsx:92,113` | Hardcoded Tailwind colors (`slate-50`, `slate-900`, `blue-600`) instead of semantic tokens | Inconsistent with design system |
| DS-03 | `header.tsx:13` | Hardcoded `bg-white/80` and `border-slate-100` | Should use `bg-card/80` and `border-border` |
| DS-04 | `header.tsx:17,20` | Hardcoded gradient colors (`from-blue-600 to-indigo-600`) | Should use CSS variable-based gradients |

### Category 2: Emoji Usage in UI (Priority: High)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| EM-01 | `onboarding/worker/profile/page.tsx:143` | Emoji in heading: "Xin chao! :wave:" | Unprofessional, should use Lucide icon |

### Category 3: Accessibility Issues (Priority: Medium)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| A11Y-01 | `worker-nav.tsx:58` | `fill-current` on active icon without aria-current | Screen readers miss active state |
| A11Y-02 | `login/page.tsx:118,133` | Input fields missing `aria-describedby` for error states | Form errors not announced |
| A11Y-03 | `worker/dashboard/page.tsx:143-145` | Bell button without aria-label | Screen reader users don't know button purpose |
| A11Y-04 | Multiple files | Interactive cards without `role="button"` or proper keyboard handling | Can't activate with keyboard |

### Category 4: Interaction & Visual Quality (Priority: Medium)

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| IQ-01 | `header.tsx:17` | `rotate-3 hover:rotate-0` on logo causes layout instability | Visual jank |
| IQ-02 | `owner/dashboard/page.tsx:298,316,333` | Mixed border-radius: `rounded-[2rem]` vs `rounded-2xl` | Visual inconsistency |
| IQ-03 | `worker/dashboard/page.tsx:409-425` | Custom inline SVG icons instead of importing from lucide-react | Code duplication, maintenance burden |

---

## Recommendations by Priority

### Immediate Actions (This Sprint)

1. **Fix Worker Nav Colors** - Replace hardcoded colors with design system tokens
   - `bg-white` → `bg-card`
   - `text-blue-600` → `text-primary`
   - `text-slate-500` → `text-muted-foreground`
   - `border-slate-200` → `border-border`

2. **Fix Landing Header** - Use semantic tokens
   - `bg-white/80` → `bg-card/80`
   - `border-slate-100` → `border-border`
   - Remove unstable `rotate` transform on logo

3. **Remove Emoji** - Replace wave emoji with `<Hand className="w-6 h-6 text-primary" />` from lucide-react

### Short-term Actions (Next 2 Sprints)

4. **Standardize Auth Pages** - Update login/signup to use design system tokens

5. **Add Missing ARIA** - Audit all interactive elements for proper labels

6. **Standardize Border Radius** - Choose between `rounded-2xl` and `rounded-[2rem]` consistently

7. **Import Standard Icons** - Replace custom SVGs in worker dashboard with lucide-react imports

### Long-term Improvements

8. **Create Component Documentation** - Document which variants to use where

9. **Add Visual Regression Tests** - Prevent design drift

10. **Dark Mode QA** - Test all pages in dark mode

---

## Suggested Next Plan

**Title:** UI Design System Consistency Sweep

**Goal:** Fix all High priority issues (DS-01 to DS-04, EM-01)

**Scope:**
1. `components/layout/worker-nav.tsx` - Convert to design system tokens
2. `components/layout/owner-nav.tsx` - Verify consistency (if exists)
3. `components/landing/header.tsx` - Remove hardcoded colors
4. `app/(auth)/login/page.tsx` - Convert to design system tokens
5. `app/(auth)/signup/page.tsx` - Convert to design system tokens
6. `app/onboarding/worker/profile/page.tsx` - Remove emoji

**Estimated Files:** 5-6 files
**Risk:** Low - Cosmetic changes only, no logic changes

---

## Files Reviewed

| File | Status |
|------|--------|
| `app/globals.css` | Good foundation |
| `components/ui/button.tsx` | Well structured |
| `components/landing/hero.tsx` | Good |
| `components/landing/header.tsx` | Needs fix |
| `components/landing/features.tsx` | Good |
| `components/job-card.tsx` | Good |
| `components/layout/worker-nav.tsx` | Needs fix |
| `app/owner/dashboard/page.tsx` | Minor issues |
| `app/worker/dashboard/page.tsx` | Minor issues |
| `app/(auth)/login/page.tsx` | Needs fix |
| `app/onboarding/worker/profile/page.tsx` | Has emoji |

---

## Unresolved Questions

1. Is dark mode a priority for MVP? (Affects fix urgency)
2. Should we standardize on `rounded-2xl` (16px) or `rounded-[2rem]` (32px)?
3. Are there brand guidelines for the logo animation? (Affects header fix)
