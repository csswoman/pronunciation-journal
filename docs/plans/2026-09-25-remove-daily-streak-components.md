# Remove Daily Streak Components Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remove daily streak components (`StreakChip`, `StreakCard`, `SessionReadyStreak`, and the Daily Streak section in `HabitHeroCard`) to align the application with the product philosophy of being free of streak pressure and guilt.

**Architecture:** Remove standalone daily streak UI components, remove their usages in parent layouts (`HomePageHeader`, `DailyProgressSidebar`, `SessionReady`, `SessionRecapCard`), and update test suites accordingly.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest.

---

### Task 1: Remove `StreakChip` Component and Update `HomePageHeader`

**Files:**
- Delete: `components/home/StreakChip.tsx`
- Delete: `components/home/__tests__/StreakChip.test.tsx`
- Modify: `components/home/HomePageHeader.tsx`
- Modify: `components/home/__tests__/HomePageHeader.test.tsx`

**Step 1: Remove `StreakChip` usage in `HomePageHeader.tsx`**

Remove `import StreakChip` and the `actions={current > 0 ? <StreakChip days={current} /> : undefined}` line from `HomePageHeader.tsx`.

**Step 2: Update `HomePageHeader.test.tsx`**

Update `HomePageHeader.test.tsx` to remove assertions looking for streak chip text `/4 días/`.

**Step 3: Delete `StreakChip.tsx` and `StreakChip.test.tsx`**

Remove the unused component and its dedicated unit test.

---

### Task 2: Remove `StreakCard` Component and Update `DailyProgressSidebar`

**Files:**
- Delete: `components/progress/StreakCard.tsx`
- Modify: `components/daily/DailyProgressSidebar.tsx`

**Step 1: Update `DailyProgressSidebar.tsx`**

Remove `import { StreakCard }` and `<StreakCard streak={data.streak} />` from `DailyProgressSidebar.tsx`.

**Step 2: Delete `StreakCard.tsx`**

Remove `components/progress/StreakCard.tsx`.

---

### Task 3: Remove `SessionReadyStreak` Component and Update `SessionReady`

**Files:**
- Delete: `components/practice/essential-words/SessionReadyStreak.tsx`
- Modify: `components/practice/essential-words/SessionReady.tsx`

**Step 1: Update `SessionReady.tsx`**

Remove `import { SessionReadyStreak }` and `<SessionReadyStreak ... />` from `SessionReady.tsx`.

**Step 2: Delete `SessionReadyStreak.tsx`**

Remove `components/practice/essential-words/SessionReadyStreak.tsx`.

---

### Task 4: Remove "RACHA DIARIA" Column from `HabitHeroCard`

**Files:**
- Modify: `components/progress/HabitHeroCard.tsx`

**Step 1: Refactor `HabitHeroCard.tsx`**

Remove Column 2 ("RACHA DIARIA") and convert the layout grid from 3 columns to 2 balanced columns ("PLAN DIARIO" and "CONSISTENCIA").

---

### Task 5: Clean up `SessionRecapCard`

**Files:**
- Modify: `components/daily/SessionRecapCard.tsx`

**Step 1: Remove streak text display**

Remove the `streak` prop rendering line (`· X días de racha`) from `SessionRecapCard.tsx`.

---

### Task 6: Run Type Checks and ESLint Verification

**Step 1: Run project verification**

Run: `pnpm type-check && pnpm lint`
Expected: 0 errors.
