# Plan 015: Split PracticeSession and GrammarStudyDeck below the 250-line limit

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- components/practice/PracticeSession.tsx components/courses/grammar-deck/GrammarStudyDeck.tsx`
> If either file changed since this plan was written, compare the structure
> against the descriptions below; on a significant mismatch treat it as a
> STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

CLAUDE.md sets a hard 250-line limit per component and a "one component = one
responsibility" rule. `PracticeSession` is 411 lines and `GrammarStudyDeck` is
342 lines. Both files have distinct visual and logical sections that map cleanly
to separate components. The split is structural only — no logic changes.

## Current state

Both files: read them fully before starting. The descriptions below are a guide,
not a substitute for reading the source.

### `components/practice/PracticeSession.tsx` — 411 lines

The file header already lists a planned structure comment. Sub-components
`SessionProgress`, `ExerciseRenderer`, `InlineFeedback`, `SessionSummary` are
already extracted in `components/practice/session/`. The remaining large
sections are:

1. **Loading branch** (~15 lines): spinner shown while session data is loading,
   with a `PhonemeFocusShell` wrapper variant.
2. **Exercising body** (~65 lines): the main active-exercise render block with
   `SessionProgress`, `ExerciseRenderer`, `InlineFeedback`, hints, and two
   `PhonemeFocusShell` variants.

All state and callbacks stay in `PracticeSession` — the new components are
purely presentational.

### `components/courses/grammar-deck/GrammarStudyDeck.tsx` — 342 lines

Sub-components `GrammarDeckHeader`, `GrammarStudyCard`, `QuizStep` are already
extracted. The remaining large sections are:

1. **Done/completion screen** (~90 lines): the `<section>` block shown after all
   cards are reviewed, with stats badges, sound-lab CTA, related lessons, and
   action buttons.
2. **Card carousel** (~65 lines): the viewport with navigation dots and prev/next
   arrows.

All state stays in `GrammarStudyDeck` — the two new components receive props.

## Scope

**In scope** (files to create or modify):
- `components/practice/PracticeSession.tsx` (modify — reduce)
- `components/practice/session/SessionLoadingShell.tsx` (create)
- `components/practice/session/SessionExercisingBody.tsx` (create)
- `components/courses/grammar-deck/GrammarStudyDeck.tsx` (modify — reduce)
- `components/courses/grammar-deck/DeckDoneScreen.tsx` (create)
- `components/courses/grammar-deck/DeckCarousel.tsx` (create)

**Out of scope** (do NOT touch):
- Any already-extracted sub-components in `components/practice/session/`
- `GrammarStudyCard.tsx`, `QuizStep.tsx`, `GrammarDeckHeader.tsx`
- No logic changes — structural decomposition only
- No prop signature changes on the parent components from their callers

## Git workflow

- Branch: `advisor/015-split-oversized-components`
- Commit: `refactor(components): split PracticeSession and GrammarStudyDeck`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Read both files fully

Read `components/practice/PracticeSession.tsx` and
`components/courses/grammar-deck/GrammarStudyDeck.tsx` in full. Identify the
exact line ranges of the sections to extract (the descriptions above are
approximate — verify against the live code).

### Step 2: Extract `SessionLoadingShell` from PracticeSession

Create `components/practice/session/SessionLoadingShell.tsx`.

It receives as props: whether focusUi mode is active, the badge string, and
the onExit callback. It renders the loading spinner in either the
`PhonemeFocusShell` wrapper or plain mode. No state, no side effects.

Add the comment block at the top per CLAUDE.md convention:
```tsx
// Planned structure:
// <SessionLoadingShell>
//   <PhonemeFocusShell>  (when focusUi mode)
//   plain spinner div    (otherwise)
// </SessionLoadingShell>
```

In `PracticeSession.tsx`, replace the loading branch render with
`<SessionLoadingShell ... />` passing the required props.

**Verify**: `pnpm type-check` → exit 0

### Step 3: Extract `SessionExercisingBody` from PracticeSession

Create `components/practice/session/SessionExercisingBody.tsx`.

It receives as props all the data needed to render the active exercise UI:
progress percentage, current phase, current exercise, retry key, last feedback,
current voice, and all callbacks (onSubmit, onRetry, onHintContinue, onExit).
It renders both the plain and `PhonemeFocusShell` variants based on a
`focusUi` boolean prop.

Add the comment block:
```tsx
// Planned structure:
// <SessionExercisingBody>
//   <PhonemeFocusShell>    (when focusUi mode)
//     <SessionProgress />
//     <ExerciseRenderer />
//     <InlineFeedback />
//     <ExerciseHints />    (hints phase)
//   </PhonemeFocusShell>
//   plain layout           (otherwise, same children)
// </SessionExercisingBody>
```

In `PracticeSession.tsx`, replace the exercising body render block with
`<SessionExercisingBody ... />`.

**Verify**: `pnpm type-check` → exit 0

**Verify line count**: `PracticeSession.tsx` has ≤ 250 lines.

### Step 4: Extract `DeckDoneScreen` from GrammarStudyDeck

Create `components/courses/grammar-deck/DeckDoneScreen.tsx`.

It receives as props: review count, total cards, quiz score, deck metadata
(sounds, related lessons), lesson ID, back href, practice loading/error state,
and callbacks (onStartSentencePractice, onRestart). It renders the entire
completion section.

Add the comment block:
```tsx
// Planned structure:
// <DeckDoneScreen>
//   stats badges
//   sentence-practice CTA
//   sound-lab link
//   related-lessons list
//   restart / back buttons
// </DeckDoneScreen>
```

In `GrammarStudyDeck.tsx`, replace the done-phase section with
`<DeckDoneScreen ... />`.

**Verify**: `pnpm type-check` → exit 0

### Step 5: Extract `DeckCarousel` from GrammarStudyDeck

Create `components/courses/grammar-deck/DeckCarousel.tsx`.

It receives as props: cards array, current index, scroll direction, reviewed
set, and navigation callbacks (onToggleReviewed, onGoTo, onNext, onPrev). It
renders the carousel viewport with dots and arrows.

Add the comment block:
```tsx
// Planned structure:
// <DeckCarousel>
//   navigation dots
//   <GrammarStudyCard />  (animated)
//   prev/next arrows
// </DeckCarousel>
```

In `GrammarStudyDeck.tsx`, replace the carousel render with
`<DeckCarousel ... />`.

**Verify**: `pnpm type-check` → exit 0

**Verify line count**: `GrammarStudyDeck.tsx` has ≤ 250 lines.

### Step 6: Full verification

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm lint:design-tokens
```

Check line counts:
```bash
# On Windows PowerShell:
(Get-Content components\practice\PracticeSession.tsx).Count
(Get-Content components\courses\grammar-deck\GrammarStudyDeck.tsx).Count
# On bash/zsh:
wc -l components/practice/PracticeSession.tsx
wc -l components/courses/grammar-deck/GrammarStudyDeck.tsx
```

Both must be ≤ 250.

## Test plan

No new tests required. This is a structural extraction; behavior is unchanged.
Any existing tests for these components must still pass without modification.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `components/practice/PracticeSession.tsx` is ≤ 250 lines
- [ ] `components/courses/grammar-deck/GrammarStudyDeck.tsx` is ≤ 250 lines
- [ ] Exactly 4 new files created; only 2 existing files modified
- [ ] Each new component file has a `// Planned structure:` comment block at the top

## STOP conditions

- The line ranges cited do not match the live code — STOP and describe the
  actual structure so the plan can be updated.
- After extraction, either parent file is still above 250 lines and you cannot
  identify further safe extractions within the stated scope — STOP and report.
- A type error requires changing a file outside the in-scope list — STOP.
- `pnpm test` fails in a test not related to these components — STOP.

## Maintenance notes

- The 4 new sub-components are purely presentational and safe to unit-test
  independently in a future pass.
- CLAUDE.md's 250-line limit applies to all future components — enforce it at
  PR review time.
- If `PhonemeFocusShell` is redesigned, `SessionLoadingShell` and
  `SessionExercisingBody` are the right files to update.
