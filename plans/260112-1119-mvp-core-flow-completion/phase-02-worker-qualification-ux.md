# Phase 02: Worker Qualification UX

**Effort:** 2h | **Priority:** P1 | **Status:** Pending

## Objective
Show workers WHY they don't qualify for Instant Book directly in JobCard.

---

## Current State

**Good:**
- `lib/job-matching.ts` has `getQualificationFeedback()` returning translation keys
- `components/job-card.tsx` already displays `qualification.feedback`
- Translation keys exist in i18n files

**Issue:**
- Feedback may not be visible/prominent enough
- Worker may not understand what action to take

---

## Task 1: Verify Feedback Display (30min)

### Files
- `/components/job-card.tsx`

### Current Code (lines 100-127)
```tsx
{qualification && qualification.feedback && (
  <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${isInstantBook
    ? 'bg-success/10 text-success'
    : 'bg-muted text-muted-foreground'
    }`}>
    ...
  </div>
)}
```

### Validation
- [ ] Load worker feed with logged-in user
- [ ] Verify feedback section renders for non-qualifying workers
- [ ] Check translation keys resolve properly

---

## Task 2: Enhance Feedback Visibility (45min)

### Files
- `/components/job-card.tsx`

### Changes
Replace current feedback section with more prominent design:

```tsx
{/* Qualification Feedback - Enhanced */}
{qualification && qualification.feedback && (
  <div className={`mb-4 p-4 rounded-xl border text-sm ${isInstantBook
    ? 'bg-success/10 border-success/20 text-success'
    : 'bg-warning/10 border-warning/20 text-warning-foreground'
  }`}>
    {isInstantBook ? (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
        <span className="font-medium">{t('matching.instantBookSuccess')}</span>
      </div>
    ) : (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <span>{t('matching.requestBookRequired')}</span>
        </div>
        {Array.isArray(qualification.feedback) && qualification.feedback.length > 0 && (
          <ul className="ml-7 space-y-1 text-muted-foreground">
            {qualification.feedback.map((f: string) => (
              <li key={f} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-warning" />
                {t(f)}
              </li>
            ))}
          </ul>
        )}
      </div>
    )}
  </div>
)}
```

### Imports to Add
```tsx
import { CheckCircle2, AlertCircle } from 'lucide-react';
```

### Validation
- [ ] Instant Book shows green success message
- [ ] Request-to-Book shows warning with bullet list of reasons
- [ ] Each reason translates correctly

---

## Task 3: Add Missing Translation Keys (30min)

### Files
- `/lib/i18n/locales/vi.json`
- `/lib/i18n/locales/en.json`

### Vietnamese Keys
```json
{
  "matching": {
    "instantBookSuccess": "Ban du dieu kien Dat ngay!",
    "requestBookRequired": "Can gui yeu cau cho chu nha hang",
    "missingLanguage": "Chua co chung chi ngon ngu yeu cau",
    "lowLanguageLevel": "Trinh do ngon ngu chua dat yeu cau",
    "lowReliability": "Diem tin cay chua du",
    "accountFrozen": "Tai khoan dang bi tam khoa",
    "notVerified": "Chua xac minh danh tinh (can quay video)",
    "needImprovement": "Can cai thien:"
  }
}
```

### English Keys
```json
{
  "matching": {
    "instantBookSuccess": "You qualify for Instant Book!",
    "requestBookRequired": "Request approval from owner",
    "missingLanguage": "Missing required language certificate",
    "lowLanguageLevel": "Language level doesn't meet requirement",
    "lowReliability": "Reliability score too low",
    "accountFrozen": "Account is temporarily frozen",
    "notVerified": "Identity not verified (need intro video)",
    "needImprovement": "Need to improve:"
  }
}
```

### Validation
- [ ] Switch to Vietnamese: feedback shows Vietnamese
- [ ] Switch to English: feedback shows English
- [ ] No missing key warnings in console

---

## Task 4: Add Action Links to Feedback (15min)

### Files
- `/components/job-card.tsx`

### Enhancement
For "notVerified" feedback, link to verification page:

```tsx
{f === 'matching.notVerified' ? (
  <Link href="/worker/profile/identity" className="underline hover:text-foreground">
    {t(f)}
  </Link>
) : (
  t(f)
)}
```

### Validation
- [ ] "Chua xac minh danh tinh" is clickable
- [ ] Clicking navigates to /worker/profile/identity
- [ ] Other feedback items are plain text

---

## Success Criteria
- [x] Workers see specific reasons for Request-to-Book
- [x] Visual distinction between Instant Book (green) and Request (warning)
- [x] Translation keys work in vi/en
- [x] Actionable items link to resolution pages

## Dependencies
- None (existing code)

## Risks
- **Low:** Translation files may have merge conflicts. Mitigation: review existing keys first.
