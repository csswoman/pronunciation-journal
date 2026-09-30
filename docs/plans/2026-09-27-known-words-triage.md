# Known Words Triage Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Provide a fast, mobile-first swipe interface allowing users to triage Essential Words by CEFR level ("Ya la sé" / "No la sé") before or outside practice sessions. A known response records declared familiarity, never objective mastery; one deterministic sample in fifteen returns as a delayed practice verification.

**Architecture:** A standalone client-side triage flow decoupled from the session machine (`useEssentialWordsSession`). It builds the deck from the lightweight catalog index, loads word chunks as cards become visible, and writes the canonical `self-declared` familiarity signal. Both legacy and skill practice queues omit claimed words from new introductions; the 1/15 sample returns after four days as a verification, not a seeded successful SRS review. Pointer Events, keyboard/tap controls, and the `SessionReady` entry point complete the flow.

### Corrección tras la revisión de implementación

- "Ya la sé" actualiza `essentialWordLearnerSignals`; no escribe `status: "mastered"` ni inventa una repetición correcta.
- El muestreo 1/15 se evalúa al construir las colas legacy y skill. Tras cuatro días, la palabra entra como verificación; una respuesta real crea evidencia.
- El mazo usa `catalog-index.json` y carga chunks bajo demanda. Una escritura fallida conserva la tarjeta para reintentar y Deshacer restaura solo la declaración de familiaridad.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 tokens, Dexie.js (offline SRS), Vitest.

---

### Task 1: Core Logic & DB Helpers (triage-deck, triage-recheck, patchRecheck, scheduleEssentialWordRecheck)

**Files:**
- Create: `lib/essential-words/triage-deck.ts`
- Create: `lib/essential-words/triage-recheck.ts`
- Modify: `lib/srs/status.ts`
- Modify: `lib/db/index.ts`
- Test: `lib/essential-words/__tests__/triage-deck.test.ts`
- Test: `lib/essential-words/__tests__/triage-recheck.test.ts`
- Test: `lib/srs/__tests__/status-recheck.test.ts`

**Step 1: Write the failing tests**
- `lib/essential-words/__tests__/triage-deck.test.ts`: test filtering by CEFR level, exclusion of any word in `srsEntries`, and ordering by rank.
- `lib/essential-words/__tests__/triage-recheck.test.ts`: test deterministic string hash output, idempotency, and sampling frequency ~1/15 across a sample set.
- `lib/srs/__tests__/status-recheck.test.ts`: test `patchRecheck` sets nextReview in +4 days, interval=4, ease=2.5, repetitions=1, status undefined.

**Step 2: Run test to verify they fail**
Run: `pnpm vitest run lib/essential-words/__tests__/triage-deck.test.ts lib/essential-words/__tests__/triage-recheck.test.ts lib/srs/__tests__/status-recheck.test.ts`

**Step 3: Implement minimal code**
- `lib/srs/status.ts`: add `patchRecheck`.
- `lib/essential-words/triage-recheck.ts`: implement `shouldSampleForRecheck` and `RECHECK_SAMPLE_RATE`.
- `lib/essential-words/triage-deck.ts`: implement `buildTriageDeck`.
- `lib/db/index.ts`: export `scheduleEssentialWordRecheck(word, days = 4, userId)`.

**Step 4: Run tests to verify they pass**
Run: `pnpm vitest run lib/essential-words/__tests__/triage-deck.test.ts lib/essential-words/__tests__/triage-recheck.test.ts lib/srs/__tests__/status-recheck.test.ts`

---

### Task 2: Swipe Gesture Pure Logic & Hook (swipe-direction & useSwipeCard)

**Files:**
- Create: `lib/gestures/swipe-direction.ts`
- Create: `hooks/useSwipeCard.ts`
- Test: `lib/gestures/__tests__/swipe-direction.test.ts`

**Step 1: Write failing test**
- Test `resolveSwipeDirection(offset, velocity, threshold, velocityThreshold)` handles left/right/null decisions correctly based on distance and velocity.

**Step 2: Run test to verify it fails**
Run: `pnpm vitest run lib/gestures/__tests__/swipe-direction.test.ts`

**Step 3: Implement swipe-direction and useSwipeCard**
- `lib/gestures/swipe-direction.ts`: pure resolver.
- `hooks/useSwipeCard.ts`: Pointer Events handler with drag offset, tilt rotation calculation, animating off-screen on dismiss, snap-back, and imperative `triggerSwipe`.

**Step 4: Run test to verify it passes**
Run: `pnpm vitest run lib/gestures/__tests__/swipe-direction.test.ts`

---

### Task 3: Triage Orchestration Hook (useKnownWordsTriage)

**Files:**
- Create: `hooks/useKnownWordsTriage.ts`
- Test: `hooks/__tests__/useKnownWordsTriage.test.ts`

**Step 1: Write failing test**
- Test loading words + SRS rows, `markKnown` (calls master or recheck according to sample), `skip` (no write, advances), `undoLast` (deletes Dexie SRS entry for marked word, restores deck cursor, updates counts).

**Step 2: Run test to verify it fails**
Run: `pnpm vitest run hooks/__tests__/useKnownWordsTriage.test.ts`

**Step 3: Implement useKnownWordsTriage**
- Connect Dexie `masterEssentialWord`, `scheduleEssentialWordRecheck`, `db.srsData.delete`.
- Manage cursor, counts, loading, and single-step undo history.

**Step 4: Run test to verify it passes**
Run: `pnpm vitest run hooks/__tests__/useKnownWordsTriage.test.ts`

---

### Task 4: UI Components for Known Words Triage

**Files:**
- Create: `components/practice/essential-words/known/TriageCard.tsx`
- Create: `components/practice/essential-words/known/TriageActionHints.tsx`
- Create: `components/practice/essential-words/known/TriageDeck.tsx`
- Create: `components/practice/essential-words/known/TriageLevelPicker.tsx`
- Create: `components/practice/essential-words/known/TriageSummary.tsx`
- Create: `components/practice/essential-words/known/KnownWordsTriage.tsx`
- Test: `components/practice/essential-words/known/__tests__/TriageActionHints.test.tsx`

**Step 1: Write test for keyboard and action button triggers**
- Verify keyboard ArrowLeft / ArrowRight and button clicks fire expected actions.

**Step 2: Implement UI components following design tokens and PastelCard**
- Max 250 lines per component.
- Strict token usage (`bg-surface-*`, `text-fg-*`, `border-border-*`, `PastelCard`).
- Accessible keyboard shortcuts and screen-reader labels.
- Audio button using `speakWord`.

**Step 3: Verify with test**
Run: `pnpm vitest run components/practice/essential-words/known/__tests__/TriageActionHints.test.tsx`

---

### Task 5: Route & SessionReady Entry Point

**Files:**
- Create: `app/(authenticated)/practice/essential-words/known/page.tsx`
- Create: `components/practice/essential-words/SessionReadyTriageCard.tsx`
- Modify: `components/practice/essential-words/SessionReady.tsx`

**Step 1: Implement page component**
- Server component wrapped in `PageLayout`, delegating to `KnownWordsTriage`.
**Step 2: Implement SessionReadyTriageCard**
- Subtle, inviting card linking to `/practice/essential-words/known`.
**Step 3: Wire into SessionReady**
- Place in right column alongside `SessionReadyVaultRow`.

---

### Task 6: End-to-end Verification & Hard Rules Audits

**Commands:**
- `pnpm type-check`
- `pnpm lint`
- `pnpm lint:design-tokens`
- `pnpm audit:hard-rules`
- Specific vitest test runs for created modules.
