# Home Mobile Redesign

**Date:** 2026-06-06  
**Status:** Approved  
**Scope:** Mobile-only home view + BottomNav visual polish. Desktop/tablet layout unchanged.

---

## Goals

1. Give mobile users immediate access to key actions (daily plan, practice, decks, courses, IPA chart, progress).
2. Surface review queue without the long scrolling desktop layout.
3. Make the BottomNav feel more polished and intentional.

---

## Architecture

The home page (`app/page.tsx`) renders two views conditioned on breakpoint:

```tsx
<div className="md:hidden">
  <HomeMobileView ... />
</div>
<div className="hidden md:block">
  {/* existing desktop sections unchanged */}
</div>
```

`HomeMobileView` is a new Server Component that receives the same data already fetched in `HomePage`. No new data fetching — props are passed down.

---

## New Components

### `HomeMobileView`

**Location:** `components/home/HomeMobileView.tsx`  
**Type:** Server Component  
**Props:** Same subset of `HomePage` data needed by its children.

Layout (vertical stack, `flex flex-col gap-6 pt-2 pb-24`):

```
HomeHeaderGreeting      ← reused as-is
HomeQuickActionsGrid    ← new
HomeDailyCard           ← reused as-is
HomeStreakCard           ← reused as-is (compact row)
HomeReviewCarousel      ← new
```

`HomeStatusHero` is **not used** in mobile — `HomeHeaderGreeting` is imported directly. The "Continue course" button from `HomeHeaderActions` is dropped (covered by the grid).

---

### `HomeQuickActionsGrid`

**Location:** `components/home/HomeQuickActionsGrid.tsx`  
**Type:** Server Component  
**Props:** none (all links are static)

2×3 grid of quick-access cards. Each card: icon + title + 1-line description + link.

| Title | Icon | Description | Href |
|-------|------|-------------|------|
| Decks | `Layers` | Your vocabulary decks | `/words?tab=decks` |
| Practice | `MicVocal` | Sounds and pronunciation | `/practice/sounds` |
| Courses | `BookOpen` | Continue your course | `/courses` |
| Progress | `BarChart2` | Your stats and streaks | `/progress` |
| IPA Chart | `Grid2x2` | Phoneme reference table | `/ipa-chart` |
| Mini Lesson | `GraduationCap` | Today's grammar bite | `/mini-lessons` |

**Styling per card:**
- `bg-surface-raised border border-border-subtle rounded-[var(--radius-xl)] p-4`
- Icon container: `rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)] p-2`
- Title: `font-body-sm font-semibold text-[var(--text-primary)]`
- Description: `font-caption text-[var(--text-tertiary)]`

Grid: `grid grid-cols-2 gap-3`

---

### `HomeReviewCarousel`

**Location:** `components/home/HomeReviewCarousel.tsx`  
**Type:** Client Component (needs `useState` for starting review session)  
**Props:** Same as `HomeReviewQueueCard` (`words`, `dueCount`, `soundsDue`)

Horizontal scroll carousel at the bottom of the mobile home.

**Structure:**
```
<section>
  <HomeSectionHeader number="02" title="Due for review" size="sm" />
  <div className="overflow-x-auto snap-x snap-mandatory flex gap-3 pb-3">
    {wordCards}
    {soundCards}
    <StartReviewCard totalDue={totalDue} onStart={handleStartReview} />
  </div>
</section>
```

**Scroll container:** `overflow-x-auto snap-x snap-mandatory -mx-4 px-4` (bleeds to screen edge)  
**Each card:** `w-[72vw] max-w-[280px] shrink-0 snap-start`

**WordCard (inline):**
- Word text (display font) + IPA + `WordStrengthBars`
- No translation (too long for compact view)

**SoundCard (inline):**
- IPA large (`text-3xl font-bold text-[var(--primary)]`) + example word
- Accuracy % + days overdue caption

**StartReviewCard (inline):**
- Total due count (large stat)
- Primary "Start review" button
- On tap: same `buildReviewPlan` → `PracticeSession` overlay flow as `HomeReviewQueueCard`

**Empty state (nothing due):**
- Single card: checkmark icon + "All caught up" + "Come back tomorrow"

---

## Modified Components

### `BottomNav.tsx` + `BottomNavTab.tsx`

Visual polish only — no structural or routing changes.

**Changes to `BottomNav`:**
- Nav background: add `backdrop-blur-md bg-[var(--card-bg)]/90`
- Increase vertical padding: `pt-3` (from `pt-2`)
- Border: keep `border-t border-[var(--line-divider)]`

**Changes to `BottomNavTab`:**
- **Active state:** show a short pill indicator above the icon (`w-5 h-0.5 rounded-full bg-[var(--primary)] mx-auto mb-1`) + label in `text-[var(--primary)]`
- **Inactive state:** icon only (no label), icon color `text-[var(--text-tertiary)]`
- Label always visible for active tab, hidden for inactive (saves space, highlights current location)

**AI Coach center button (via `AICoachTrigger variant="nav"`):**
- Ensure it has `shadow-[0_4px_14px_var(--accent-dim)]` for glow effect
- Slightly larger touch target if not already (`h-12 w-12` min)
- No structural changes — only CSS tokens

---

## What Does NOT Change

- `HomeTodaySection`, `HomeReviewsSection`, `HomeLearnSection` — desktop only, untouched
- `HomeReviewQueueCard`, `HomeRetentionCard` — desktop only, untouched  
- All data fetching in `app/page.tsx` — unchanged, props passed to both views
- Routing, auth, offline behavior — unchanged
- `BottomNavMenu` slide-up — unchanged

---

## Constraints

- No new Supabase queries — all data already fetched in `HomePage`
- `HomeReviewCarousel` reuses `buildReviewPlan` (already client-side)
- All new components follow the 250-line limit and single-responsibility rule
- Offline mode unaffected — carousel degrades gracefully with empty arrays
- RLS: no new tables

---

## File Checklist

| File | Action |
|------|--------|
| `app/page.tsx` | Add `HomeMobileView` conditional block |
| `components/home/HomeMobileView.tsx` | New Server Component |
| `components/home/HomeQuickActionsGrid.tsx` | New Server Component |
| `components/home/HomeReviewCarousel.tsx` | New Client Component |
| `components/layout/BottomNav.tsx` | CSS polish only |
| `components/layout/BottomNavTab.tsx` | Active/inactive state redesign |
