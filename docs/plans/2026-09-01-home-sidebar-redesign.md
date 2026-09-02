# Home and Right Sidebar Redesign Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remodel the Home page layout to match reference design: move Chunk and Word of the Day into the right sidebar, move progress stats below the daily plan card, add top-right header badges (streak + target minutes), and add Immersion and Extra Exercises cards to the main feed.

**Architecture:** Deconstruct Home layout into clean, single-responsibility components under `components/home/`, each under 250 lines. Preserve existing data providers and queries, passing values cleanly through `HomeCommandGrid`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Dexie.js, Lucide React icons / design tokens.

---

### Task 1: Create HomeHeader Component with Top-Right Badges

**Files:**
- Create: `components/home/HomeHeader.tsx`
- Modify: `components/home/HomeCommandGrid.tsx`

**Step 1: Write component `HomeHeader.tsx`**
Create `components/home/HomeHeader.tsx` displaying:
- Greeting ("Buenas noches, [Nombre]" or time-based greeting)
- Title ("Plan de hoy")
- Top-right badges: `🔥 [streak] racha` and `[min]/24 min hoy`.

**Step 2: Commit**
`git add components/home/HomeHeader.tsx`
`git commit -m "feat(home): add HomeHeader with top-right streak and minute badges"`

---

### Task 2: Create HomeStatsRow Component (Palabras Esenciales + En Repaso)

**Files:**
- Create: `components/home/HomeStatsRow.tsx`
- Modify: `components/home/HomeCommandGrid.tsx`

**Step 1: Write component `HomeStatsRow.tsx`**
Create `components/home/HomeStatsRow.tsx` rendering:
- Left stat box: `Palabras esenciales · [Nivel]` (`[learnedCount] de [totalLevelWords]`)
- Right stat box: `En repaso` (`[wordsDueCount]`, subtitle "Empiezan tras tus primeras palabras")

**Step 2: Commit**
`git add components/home/HomeStatsRow.tsx`
`git commit -m "feat(home): add HomeStatsRow component under daily plan"`

---

### Task 3: Create HomeImmersionCard and HomeExtraExercisesAccordion Components

**Files:**
- Create: `components/home/HomeImmersionCard.tsx`
- Create: `components/home/HomeExtraExercisesAccordion.tsx`
- Modify: `components/home/HomeCommandGrid.tsx`

**Step 1: Write `HomeImmersionCard.tsx`**
Card with title "Registrar inmersión", category chips (`Video`, `Serie`, `Podcast`, `Lectura`), minutes input, and `Registrar` action button.

**Step 2: Write `HomeExtraExercisesAccordion.tsx`**
Accordion item with lock icon, title "Ejercicios extra", subtitle "Se abren al terminar el plan de hoy".

**Step 3: Commit**
`git add components/home/HomeImmersionCard.tsx components/home/HomeExtraExercisesAccordion.tsx`
`git commit -m "feat(home): add HomeImmersionCard and HomeExtraExercisesAccordion"`

---

### Task 4: Create HomeRightSidebar Component and Assemble Grid

**Files:**
- Create: `components/home/HomeRightSidebar.tsx`
- Modify: `components/home/HomeCommandGrid.tsx`
- Modify: `components/home/HomeLayout.tsx`
- Modify: `app/(authenticated)/page.tsx`

**Step 1: Create `HomeRightSidebar.tsx`**
Group `HomeChunkOfDayCard`, `HomeWordOfDayCard`, and pending review chips ("Te tocan hoy") vertically in a 360px sidebar container.

**Step 2: Reorganize `HomeCommandGrid.tsx`**
Update 2-column layout to place HomeHeader, HomeDailyCard, HomeStatsRow, HomeImmersionCard, and HomeExtraExercisesAccordion in Column 1 (main feed), and HomeRightSidebar in Column 2.

**Step 3: Verify and type-check**
Run `pnpm type-check && pnpm lint && pnpm test` to verify zero type or lint errors.

**Step 4: Commit**
`git add components/home/ app/(authenticated)/page.tsx`
`git commit -m "feat(home): integrate home right sidebar with chunk and word of the day"`
