# Practice Page Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all P1–P3 critique findings on the practice page catalog and session summary, and make the page fully mobile-responsive.

**Architecture:** Six independent tasks targeting: (1) remove hero-metric stat row, (2) remove confetti, (3) fix active chip color token, (4) add empty state for zero search results, (5) fix mobile layout for filter bar + bento grid, (6) expand HeroCompactHeader from single-line JSX. Each task touches one file or a tightly coupled pair.

**Tech Stack:** Next.js 15, React 19, Tailwind v4, CSS custom properties (design tokens), TypeScript

---

## File Map

| File | What changes |
|---|---|
| `components/practice/PracticeLessonsPage.tsx` | Remove 4-stat hero-metric block; add inline context line under "Available Lessons" heading |
| `components/practice/LessonFilters.tsx` | Fix active chip token; fix mobile layout (wrap, responsive) |
| `components/practice/LessonGrid.tsx` | Add empty state for `lessons.length === 0 && !isLoading`; fix bento grid mobile |
| `components/practice/session/SessionSummary.tsx` | Remove confetti import and effect; replace with CSS pulse on accuracy number |
| `components/layout/page-header/HeroCompactHeader.tsx` | Expand from single-line JSX to readable multi-line JSX |

---

## Task 1: Remove hero-metric stat row from PracticeLessonsPage

The four stat cards (Exercises / Page / Completed / In Progress) are a banned hero-metric pattern. Replace with a single contextual line injected as a `statLine` prop into the existing `LessonFilters` component.

**Files:**
- Modify: `components/practice/PracticeLessonsPage.tsx`
- Modify: `components/practice/LessonFilters.tsx`

- [ ] **Step 1: Remove the `statCard` object and the 4-stat grid from PracticeLessonsPage**

  In `components/practice/PracticeLessonsPage.tsx`, delete lines 18–26 (the `statCard` const) and lines 124–162 (the `{/* Stats row */}` block). The file should go from `<PageLayout ...>` directly into `<LessonFilters ...>`.

  Also remove the now-unused `setDayStreak` — change line 34 from:
  ```tsx
  const [, setDayStreak] = useState(0)
  ```
  to nothing (delete the line entirely), and delete the `getUserStats` import from `@/lib/db` on line 8 if it is only used there.

  Then add a `statLine` prop to the `<LessonFilters>` call:
  ```tsx
  <LessonFilters
    filter={filter}
    search={search}
    resultCount={filteredLessons.length}
    statLine={`${completedCount} completed · ${inProgressCount} in progress`}
    onFilterChange={setFilter}
    onSearchChange={setSearch}
  />
  ```

- [ ] **Step 2: Add `statLine` prop to LessonFilters and render it as subdued caption**

  In `components/practice/LessonFilters.tsx`, extend the interface:
  ```tsx
  interface LessonFiltersProps {
    filter: PracticeFilter
    search: string
    resultCount: number
    statLine?: string          // ← add this
    onFilterChange: (f: PracticeFilter) => void
    onSearchChange: (s: string) => void
  }
  ```

  Add `statLine` to destructuring, then render it below the result count:
  ```tsx
  <div className="flex flex-col" style={{ gap: "2px" }}>
    <h2 style={{ font: "var(--font-h4)", color: "var(--text-primary)", letterSpacing: "-0.01em", margin: 0 }}>
      Available Lessons
    </h2>
    <span
      style={{
        font: "var(--font-tiny)",
        color: "var(--text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {resultCount} exercises available
      {statLine && <> · {statLine}</>}
    </span>
  </div>
  ```

- [ ] **Step 3: Verify TypeScript compiles with no errors**
  ```bash
  cd d:/proyectos/english-journal && npx tsc --noEmit 2>&1 | head -30
  ```
  Expected: no errors referencing PracticeLessonsPage or LessonFilters.

- [ ] **Step 4: Commit**
  ```bash
  git add components/practice/PracticeLessonsPage.tsx components/practice/LessonFilters.tsx
  git commit -m "fix(practice): remove hero-metric stat row, inline progress into filter bar"
  ```

---

## Task 2: Remove confetti from SessionSummary

Confetti at ≥50% violates the product's anti-reference (Duolingo gamification). Replace with a brief CSS animation on the accuracy number for excellent scores only.

**Files:**
- Modify: `components/practice/session/SessionSummary.tsx`

- [ ] **Step 1: Remove confetti import and effect**

  Delete line 5 (`import confetti from 'canvas-confetti'`) and the entire `useEffect` block (lines 65–90) from `SessionSummary`. Also remove the `useEffect` import from line 3 if it is no longer used anywhere in the file (check: the `firedRef` and `useEffect` are only in that block).

  The `useRef` import can also be removed if `firedRef` is the only ref.

  The `correctCount` variable on line 64 is still used in the JSX (`{correctCount} of ...`), keep it.

- [ ] **Step 2: Add a CSS keyframe for the accuracy pulse and apply it to excellent scores**

  In `components/practice/session/SessionSummary.tsx`, update `AccuracyDisplay` to apply an animation class when `accuracy >= 85`:

  ```tsx
  function AccuracyDisplay({ accuracy }: { accuracy: number }) {
    const isExcellent = accuracy >= 85
    const isAcceptable = accuracy >= 60

    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={`Accuracy ${accuracy} percent`}
        className={cn(
          'text-6xl font-bold tabular-nums',
          isExcellent
            ? 'text-success animate-[accuracy-pop_0.4s_var(--ease-out-quart)_both]'
            : isAcceptable
              ? 'text-warning'
              : 'text-error',
        )}
      >
        {accuracy}%
      </div>
    )
  }
  ```

  Then add the keyframe to `app/styles/animations.css` (or wherever `@keyframes` live in the project):
  ```css
  @keyframes accuracy-pop {
    0%   { transform: scale(0.85); opacity: 0; }
    60%  { transform: scale(1.06); }
    100% { transform: scale(1);    opacity: 1; }
  }
  ```

- [ ] **Step 3: Check animations.css path and add the keyframe**

  Read `app/styles/animations.css` first to confirm it exists and is where keyframes live, then append the keyframe at the end of that file.

- [ ] **Step 4: Verify `canvas-confetti` is no longer imported anywhere in practice session files**
  ```bash
  grep -r "canvas-confetti" d:/proyectos/english-journal/components/practice/ 2>&1
  ```
  Expected: no output.

- [ ] **Step 5: TypeScript check**
  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no errors.

- [ ] **Step 6: Commit**
  ```bash
  git add components/practice/session/SessionSummary.tsx app/styles/animations.css
  git commit -m "fix(practice): replace confetti with css accuracy-pop animation on excellent scores"
  ```

---

## Task 3: Fix active filter chip token (One Voice Rule violation)

The active chip uses `background: var(--primary)` (a full interactive color fill). The design system chip spec requires `primary-soft` background + `primary` text on selected state.

**Files:**
- Modify: `components/practice/LessonFilters.tsx`

- [ ] **Step 1: Update the active chip style in LessonFilters**

  In `components/practice/LessonFilters.tsx`, find the `isActive` branch of the filter button style (around line 99–110) and change it from:
  ```tsx
  isActive
    ? {
        background: "var(--primary)",
        color: "var(--on-primary)",
        border: "1px solid var(--primary)",
        ...
      }
  ```
  to:
  ```tsx
  isActive
    ? {
        background: "var(--primary-soft)",
        color: "var(--primary)",
        border: "1px solid transparent",
        borderRadius: "var(--radius-full)",
        font: "var(--font-caption)",
        fontWeight: 600,
        padding: "4px var(--space-3)",
        cursor: "pointer",
      }
  ```

- [ ] **Step 2: TypeScript check**
  ```bash
  npx tsc --noEmit 2>&1 | head -10
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add components/practice/LessonFilters.tsx
  git commit -m "fix(practice): active filter chip uses primary-soft bg per design token spec"
  ```

---

## Task 4: Add empty state for zero search/filter results

When `lessons.length === 0 && !isLoading`, `LessonGrid` renders nothing. Add a clear empty state with a reset action.

**Files:**
- Modify: `components/practice/LessonGrid.tsx`
- Modify: `components/practice/PracticeLessonsPage.tsx` (pass reset callback)

- [ ] **Step 1: Add `onClearFilters` prop to LessonGrid**

  In `components/practice/LessonGrid.tsx`, extend the interface:
  ```tsx
  interface LessonGridProps {
    lessons: Lesson[]
    totalCount: number
    currentPage: number
    totalPages: number
    gridKey: number
    soundProgressMap: Map<string, number>
    isLoading: boolean
    onPageChange: (page: number) => void
    onClearFilters?: () => void   // ← add
  }
  ```

  Add `onClearFilters` to destructuring.

- [ ] **Step 2: Add the empty state block inside LessonGrid, before the bento/grid render**

  After the `isLoading` early-return block, add:
  ```tsx
  if (lessons.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 text-center"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <span style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
          No lessons match your search.
        </span>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            style={{
              font: "var(--font-caption)",
              fontWeight: 500,
              color: "var(--primary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 3: Pass `onClearFilters` from PracticeLessonsPage to LessonGrid**

  In `components/practice/PracticeLessonsPage.tsx`, add a `handleClearFilters` callback and pass it:
  ```tsx
  const handleClearFilters = () => {
    setFilter('all')
    setSearch('')
  }
  ```

  Update the `<LessonGrid>` call:
  ```tsx
  <LessonGrid
    lessons={paginatedLessons}
    totalCount={filteredLessons.length}
    currentPage={currentPage}
    totalPages={totalPages}
    gridKey={gridKey}
    soundProgressMap={soundProgressMap}
    isLoading={isLoadingLessons}
    onPageChange={handlePageChange}
    onClearFilters={handleClearFilters}
  />
  ```

  Note: `setFilter` and `setSearch` are already available from the `useLessonFilters` hook destructure.

- [ ] **Step 4: TypeScript check**
  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add components/practice/LessonGrid.tsx components/practice/PracticeLessonsPage.tsx
  git commit -m "feat(practice): add empty state with clear-filters action to lesson grid"
  ```

---

## Task 5: Mobile layout fixes — filter bar and bento grid

Two mobile breakage points:
1. `LessonFilters` uses `flex items-start justify-between` with no wrap — the right side (search + 5 pills) overflows on small screens.
2. `LessonGrid` bento uses `gridTemplateColumns: "repeat(6, 1fr)"` with no responsive override — cards collapse to ~60px on 375px.

**Files:**
- Modify: `components/practice/LessonFilters.tsx`
- Modify: `components/practice/LessonGrid.tsx`

- [ ] **Step 1: Make LessonFilters wrap vertically on mobile**

  Replace the outer `div` in LessonFilters from:
  ```tsx
  <div
    className="flex items-start justify-between"
    style={{ gap: "var(--space-6)", marginBottom: "var(--space-5)" }}
  >
  ```
  to:
  ```tsx
  <div
    className="flex flex-col sm:flex-row sm:items-start sm:justify-between"
    style={{ gap: "var(--space-3)", marginBottom: "var(--space-5)" }}
  >
  ```

  The right-side controls container (search + pill tabs) currently uses `flex items-center shrink-0`. On mobile it should also wrap the pills below the search. Replace:
  ```tsx
  <div className="flex items-center shrink-0" style={{ gap: "var(--space-3)" }}>
    {/* Search */}
    <div className="relative" style={{ width: "200px" }}>
  ```
  with:
  ```tsx
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
    {/* Search */}
    <div className="relative w-full sm:w-[200px]">
  ```

  The pill tabs row should also allow wrapping on mobile:
  ```tsx
  <div className="flex flex-wrap items-center" style={{ gap: "var(--space-1)" }}>
  ```

- [ ] **Step 2: Fix bento grid on mobile**

  In `components/practice/LessonGrid.tsx`, replace the bento grid container from:
  ```tsx
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: "var(--space-3)",
    }}
  >
  ```
  with:
  ```tsx
  <div
    className="grid"
    style={{
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "var(--space-3)",
    }}
  >
  ```

  And override column spans using responsive Tailwind classes instead of inline `style`:

  Featured card:
  ```tsx
  {/* Featured: full width mobile, left half tablet+ */}
  <div className="col-span-2 sm:col-span-3 sm:row-span-2">
    <LessonCard
      lesson={lessons[0]}
      progressPct={getProgress(lessons[0])}
      isFeatured
    />
  </div>
  ```

  Wide cards (lessons[1] and [2]):
  ```tsx
  {lessons.slice(1, 3).map((lesson) => (
    <div key={lesson.id} className="col-span-2 sm:col-span-3">
      <LessonCard lesson={lesson} progressPct={getProgress(lesson)} />
    </div>
  ))}
  ```

  Normal cards (lessons[3]+):
  ```tsx
  {lessons.slice(3).map((lesson) => (
    <div key={lesson.id} className="col-span-1 sm:col-span-2">
      <LessonCard lesson={lesson} progressPct={getProgress(lesson)} />
    </div>
  ))}
  ```

  Also update the bento grid container to use a 6-column grid on sm+:
  ```tsx
  <div
    className="grid grid-cols-2 sm:grid-cols-6"
    style={{ gap: "var(--space-3)" }}
  >
  ```

- [ ] **Step 3: Fix PracticeLessonsPage content padding for mobile**

  `PageLayout` receives `contentStyle={{ padding: "var(--space-6) var(--space-8) 3.5rem" }}` — on mobile, `var(--space-8)` (2rem) horizontal padding inside the card wrapper (which adds its own `px-3`) is tight. Change to:
  ```tsx
  <PageLayout
    contentStyle={{ padding: "var(--space-4) var(--space-4) 3.5rem" }}
    // sm: handled by PageLayout's built-in sm:px-6 responsive classes
  ```

  Note: `PageLayout` with `useCard=true` already applies `px-3 sm:px-6 lg:px-10` to the content div, so the `contentStyle` padding overrides that. The cleanest fix is to pass `contentStyle` only for vertical padding:
  ```tsx
  contentStyle={{ paddingTop: "var(--space-5)", paddingBottom: "3.5rem" }}
  ```
  This lets PageLayout's responsive horizontal padding take over.

- [ ] **Step 4: TypeScript check**
  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add components/practice/LessonFilters.tsx components/practice/LessonGrid.tsx components/practice/PracticeLessonsPage.tsx
  git commit -m "fix(practice): responsive filter bar and bento grid for mobile"
  ```

---

## Task 6: Expand HeroCompactHeader from single-line JSX

`HeroCompactHeader.tsx` line 6 is ~1200 chars of JSX on one line — un-reviewable, un-diffable, and against code quality standards.

**Files:**
- Modify: `components/layout/page-header/HeroCompactHeader.tsx`

- [ ] **Step 1: Read the current file content in full**

  Read `components/layout/page-header/HeroCompactHeader.tsx` completely (it is currently 7 lines total).

- [ ] **Step 2: Rewrite with formatted JSX**

  Replace the file content with the formatted equivalent. The logic must stay identical — this is a pure formatting change:

  ```tsx
  import { ResumeButton, CtaButtons } from "./PageHeaderButtons";
  import type { PageHeaderDerived } from "./types";

  export function HeroCompactHeader({
    badge,
    title,
    subtitle,
    primaryCta,
    secondaryCta,
    hasProgress,
    safeProgress,
    lessonTitle,
    phonemeLabel,
    onContinue,
    className = "",
  }: PageHeaderDerived) {
    const words = subtitle?.split(" ") ?? [];
    const accent = words.slice(0, 2).join(" ");
    const tail = words.slice(2).join(" ");

    return (
      <div
        className={["flex flex-col", className].join(" ")}
        style={{
          padding: "var(--space-6) var(--space-8) var(--space-5)",
          gap: "var(--space-5)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-start justify-between" style={{ gap: "var(--space-6)" }}>
          <div className="flex flex-col" style={{ gap: "var(--space-1)" }}>
            {badge && (
              <span
                style={{
                  font: "var(--font-tiny)",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {badge}
              </span>
            )}
            <h1
              style={{
                font: "var(--font-h2)",
                color: "var(--text-primary)",
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              {title}
              {subtitle && (
                <>
                  {", "}
                  <span style={{ color: "var(--primary)" }}>{accent}</span>
                  {tail && <span style={{ color: "var(--text-primary)" }}> {tail}</span>}
                </>
              )}
            </h1>
          </div>

          {hasProgress && onContinue && (
            <div className="shrink-0">
              <ResumeButton onClick={onContinue} />
            </div>
          )}

          {!hasProgress && (primaryCta || secondaryCta) && (
            <div className="flex gap-3 shrink-0">
              <CtaButtons primaryCta={primaryCta} secondaryCta={secondaryCta} rounded="full" />
            </div>
          )}
        </div>

        {hasProgress && (
          <div
            className="flex items-center"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-4) var(--space-5)",
              gap: "var(--space-4)",
              overflow: "hidden",
            }}
          >
            {phonemeLabel && (
              <div
                className="shrink-0 flex items-center justify-center"
                style={{
                  background: "var(--primary-soft)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-2) var(--space-3)",
                  minWidth: "64px",
                }}
              >
                <span
                  style={{
                    font: "var(--font-h4)",
                    fontWeight: 300,
                    color: "var(--primary)",
                  }}
                >
                  {phonemeLabel}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0 flex flex-col" style={{ gap: "var(--space-1)" }}>
              <span
                style={{
                  font: "var(--font-tiny)",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Continuing
              </span>
              <div className="flex items-center justify-between" style={{ gap: "var(--space-3)" }}>
                <span
                  className="truncate"
                  style={{
                    font: "var(--font-body-sm)",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {lessonTitle}
                </span>
                <span
                  className="shrink-0 tabular-nums"
                  style={{
                    font: "var(--font-body-sm)",
                    fontWeight: 600,
                    color: "var(--primary)",
                  }}
                >
                  {safeProgress}%
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--surface-sunken)",
                  overflow: "hidden",
                  marginTop: "var(--space-1)",
                }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${safeProgress}%`,
                    borderRadius: "var(--radius-full)",
                    background: "var(--primary)",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: TypeScript check**
  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no errors. The logic is identical; only formatting changed.

- [ ] **Step 4: Commit**
  ```bash
  git add components/layout/page-header/HeroCompactHeader.tsx
  git commit -m "refactor(header): expand HeroCompactHeader from single-line to readable JSX"
  ```

---

## Self-Review

**Spec coverage check:**

| Finding | Task |
|---|---|
| P1: Hero-metric stat row | Task 1 |
| P1: Confetti on 50%+ | Task 2 |
| P2: Active chip token violation | Task 3 |
| P2: Empty search state | Task 4 |
| Mobile: filter bar overflow | Task 5 |
| Mobile: bento grid 6-col unresponsive | Task 5 |
| Mobile: content padding | Task 5 |
| P3: HeroCompactHeader single-line | Task 6 |

**Gaps identified:**
- The `deriveLessonDescription` hardcoded strings and "Page" stat duplication with pagination are noted observations but are out of scope for this plan (they require data model or content changes).
- The `statCard` object uses `style={{}}` inline — Task 1 removes it entirely rather than converting, which is cleaner.

**Placeholder scan:** None found. All steps have concrete code.

**Type consistency check:**
- `onClearFilters?: () => void` prop added to `LessonGridProps` in Task 4 and passed from `PracticeLessonsPage` — consistent.
- `statLine?: string` prop added to `LessonFiltersProps` in Task 1 — consistent with usage.
- `handleClearFilters` in Task 4 calls `setFilter('all')` and `setSearch('')` — both are available from `useLessonFilters` destructure in the existing component.
