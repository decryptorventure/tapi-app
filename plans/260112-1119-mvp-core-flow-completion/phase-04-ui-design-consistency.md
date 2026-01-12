# Phase 04: UI Design Consistency

**Effort:** 2h | **Priority:** P2 | **Status:** Pending

## Objective
Align worker QR page and other components with design system (semantic colors, Lucide icons, no hardcoded hex).

---

## Current State

**Issue (Worker QR Page `/app/worker/jobs/[id]/qr/page.tsx`):**
- Uses hardcoded Tailwind colors: `bg-blue-600`, `text-slate-900`, `bg-green-100`
- Should use semantic tokens: `bg-cta`, `text-foreground`, `bg-success/10`

**Design System Reference:**
- `app/globals.css` defines CSS variables
- Semantic tokens: `foreground`, `muted-foreground`, `primary`, `cta`, `success`, `warning`, `destructive`

---

## Task 1: Audit Worker QR Page (30min)

### Files
- `/app/worker/jobs/[id]/qr/page.tsx`

### Current Issues (with line numbers)
| Line | Current | Should Be |
|------|---------|-----------|
| 170 | `bg-gradient-to-b from-slate-50 to-white` | `bg-background` |
| 181 | `text-red-500` | `text-destructive` |
| 182 | `text-slate-900` | `text-foreground` |
| 183 | `text-slate-600` | `text-muted-foreground` |
| 184 | `text-blue-600` | `text-primary` |
| 192 | `from-blue-50` | `from-primary/5` |
| 194 | `bg-white border-slate-200` | `bg-card border-border` |
| 197 | `hover:bg-slate-100` | `hover:bg-muted` |
| 198 | `text-slate-600` | `text-muted-foreground` |
| 201-203 | `bg-blue-100`, `text-blue-600` | `bg-primary/10`, `text-primary` |
| 204 | `text-slate-900` | `text-foreground` |
| 212-213 | `bg-green-100 border-green-200` | `bg-success/10 border-success/20` |
| 214-217 | `text-green-*` | `text-success` |
| 221 | `bg-white rounded-xl shadow-sm border-slate-200` | `bg-card border-border` |
| 249 | `bg-blue-600` | `bg-cta` |
| 255 | `bg-white border-slate-200` | `bg-card border-border` |
| 259-277 | `text-slate-*` | `text-foreground/muted-foreground` |
| 284 | `text-orange-600` | `text-cta` |
| 292 | `bg-yellow-50 border-yellow-200` | `bg-warning/10 border-warning/20` |
| 293-295 | `text-yellow-*` | `text-warning` |

---

## Task 2: Apply Design System Fixes (1h)

### Files
- `/app/worker/jobs/[id]/qr/page.tsx`

### Full Replacement Pattern

**Loading State (line 168-174):**
```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-cta" />
    </div>
  );
}
```

**Error State (line 176-189):**
```tsx
if (!application) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Khong tim thay</h2>
        <p className="text-muted-foreground mb-4">Khong tim thay don ung tuyen nay</p>
        <Link href="/worker/jobs" className="text-primary hover:underline">
          Quay lai danh sach
        </Link>
      </div>
    </div>
  );
}
```

**Header (line 191-208):**
```tsx
<div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
  {/* Header */}
  <div className="bg-card border-b border-border sticky top-0 z-10">
    <div className="container mx-auto px-4 py-4 max-w-lg">
      <div className="flex items-center gap-4">
        <Link href="/worker/jobs" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <QrCode className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Ma QR Check-in</h1>
        </div>
      </div>
    </div>
  </div>
```

**Status Banner (line 211-219):**
```tsx
<div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-center gap-3">
  <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
  <div>
    <p className="font-medium text-success">Don da duoc duyet</p>
    <p className="text-sm text-success/80">Den dia diem va cho owner quet ma nay</p>
  </div>
</div>
```

**Countdown Timer (line 248-252):**
```tsx
<div className="bg-cta text-cta-foreground rounded-xl p-4 text-center">
  <p className="text-sm opacity-80 mb-1">Ca lam bat dau</p>
  <p className="text-2xl font-bold">{timeUntilShift}</p>
</div>
```

**Instructions (line 291-300):**
```tsx
<div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
  <h4 className="font-medium text-warning mb-2">Huong dan</h4>
  <ul className="text-sm text-warning/80 space-y-1">
    <li>1. Den dung gio tai dia chi nha hang</li>
    <li>2. Tim owner/quan ly va cho ho quet ma QR</li>
    <li>3. Hoan thanh ca lam viec</li>
    <li>4. Quet lai ma QR khi check-out</li>
  </ul>
</div>
```

### Validation
- [ ] No hardcoded color classes remain (grep for `slate-`, `blue-`, `green-`, `yellow-`, `orange-`, `red-`)
- [ ] Visual appearance consistent with owner pages
- [ ] Dark mode works (if applicable)

---

## Task 3: Check Other Pages for Consistency (30min)

### Files to Audit
- `/app/worker/jobs/page.tsx` - Worker jobs list
- `/app/worker/dashboard/page.tsx` - Worker dashboard
- `/app/worker/feed/page.tsx` - Job feed

### Quick Grep Check
```bash
grep -rn "slate-\|blue-\|green-\|yellow-\|orange-\|red-" app/worker/
```

### Fix Pattern
Replace all hardcoded colors with semantic equivalents per mapping above.

### Validation
- [ ] No hardcoded colors in worker pages
- [ ] Consistent look across worker flow

---

## Success Criteria
- [x] Worker QR page uses semantic design tokens
- [x] No hardcoded Tailwind color classes in worker pages
- [x] Visual consistency with owner pages
- [x] Lucide icons used consistently

## Dependencies
- None

## Risks
- **Low:** May reveal additional pages needing fixes. Scope to critical paths only.
