# Exercise Shell UX — Design Spec

**Date:** 2026-06-13  
**Status:** Approved  
**Scope:** Generic vocabulary exercises only (fill_blank, sentence_dictation, reorder_words, multiple_choice, sentence_context, match_pairs). Phoneme exercises (pick_word, dictation, etc.) are untouched.

---

## Problem

Generic exercises have inconsistent, fragmented UX:

1. No unified title / exercise type label — user doesn't know what kind of task they're doing.
2. No hint context visible upfront — sentence_dictation starts blank with no anchor.
3. No "Continue" button — exercises call `onSubmit` immediately on answer, jumping to the next card before the user can read feedback.
4. Closing the session exits immediately without confirmation — destructive and jarring.
5. Layout and feedback patterns differ across every exercise component.

---

## Design

### 1. ExerciseShell component

New file: `components/exercises/ExerciseShell.tsx`

Wraps all generic exercises with a consistent layout:

```
┌─────────────────────────────────┐
│ LISTEN AND TYPE          [skip] │  ← eyebrow title + skip (idle only)
│                                 │
│  💡 idyllic · "tranquilo"       │  ← hint chip (always visible when present)
│                                 │
│  [exercise content]             │  ← children
│                                 │
│  [──── Continue ────]           │  ← appears after answer, replaces skip
└─────────────────────────────────┘
```

**Props:**

```tsx
interface ExerciseShellProps {
  title: string                   // Exercise type label
  hint?: { word: string; meaning?: string } // Always visible above content
  result: ExerciseResult | null   // null = idle, set = answered
  onContinue: () => void          // Shell calls this → parent advances
  onSkip: () => void              // Only shown while idle
  children: React.ReactNode
}

type ExerciseResult = {
  isCorrect: boolean
  userAnswer: string
  timeMs: number
}
```

**Behavior:**
- While `result === null`: show skip button (top-right, text style), no Continue.
- While `result !== null`: hide skip, show Continue button (full-width, primary).
- The hint chip is always rendered if present — never hidden behind a tap.
- Continue button is always enabled once result is set (no disabled state).

### 2. ExerciseRenderer changes

`ExerciseRenderer` gains local state:

```tsx
const [result, setResult] = useState<ExerciseResult | null>(null)
```

- Passes `onResult` (not `onSubmit`) to each generic exercise child.
- When child calls `onResult`, stores it in state — does NOT call parent `onSubmit` yet.
- Passes `result` + `onContinue` to `ExerciseShell`.
- `onContinue` calls parent `onSubmit(result.isCorrect, result.userAnswer)` and resets result.
- Resets `result` to `null` on `exercise.id` change.

The `focusUi` path is unchanged — phoneme exercises bypass `ExerciseShell` entirely.

### 3. Generic exercise interface change

Each generic exercise component replaces `onSubmit` with `onResult`:

```tsx
// Before
onSubmit: (isCorrect: boolean, userAnswer: string, timeMs: number) => void

// After
onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
```

Components affected: `FillBlankExercise`, `SentenceDictationExercise`, `ReorderWordsExercise`, `MultipleChoiceExercise`, `SentenceContextExercise`, `MatchPairsExercise`.

Each component no longer renders its own skip/continue footer — that's the shell's job.

### 4. Hint for sentence_dictation

The `SentenceDictationExercise` type gains two optional fields:

```ts
// lib/exercises/types.ts
targetWord?: string    // e.g. "idyllic"
targetMeaning?: string // e.g. "tranquilo y pintoresco"
```

The generator (`lib/exercises/generators/sentence-dictation.ts`) populates these from `entry.text` and `entry.meaning`.

`ExerciseRenderer` reads these fields and passes them as `hint` to `ExerciseShell`.

For `fill_blank`, the existing `hint` field (definition) is passed as `hint.meaning` with no `hint.word` — or omitted if absent.

### 5. Exercise titles per slug

| slug | title |
|---|---|
| `sentence_dictation` | "Listen and type" |
| `fill_blank` | "Complete the sentence" |
| `reorder_words` | "Put in order" |
| `multiple_choice` | "Choose the correct answer" |
| `sentence_context` | "Choose the best option" |
| `match_pairs` | "Match the pairs" |

Defined as a const map in `ExerciseRenderer` — not in the shell.

### 6. Exit confirmation bottom sheet

When the user taps X (close session), instead of exiting immediately, show a bottom sheet:

```
┌─────────────────────────────────┐
│  ¿Abandonar la sesión?          │
│  Perderás tu progreso actual.   │
│                                 │
│  [──── Salir de la sesión ────] │  ← destructive (red/error token)
│  [──── Seguir practicando ────] │  ← neutral surface
└─────────────────────────────────┘
```

New component: `components/exercises/ExitConfirmSheet.tsx`  
Triggered from `SessionExercisingBody` (or its parent) when X is pressed.  
Uses the existing modal/sheet pattern in the codebase if one exists; otherwise a fixed bottom overlay with backdrop.

**Scope note:** The exit handler (`onExit`) originates in `PracticeSession` and flows down through `SessionExercisingBody`. The X button that triggers it lives in `PhonemeFocusShell` (focusUi) or in the plain layout header. The confirmation sheet is rendered inside `SessionExercisingBody` — it intercepts the X tap locally before calling the real `onExit` prop.

---

## What does NOT change

- `PhonemeFocusShell` and all phoneme exercise components.
- `SessionExercisingBody` layout and phase state machine (exercising → feedback → hints → complete).
- The parent `onSubmit(isCorrect, userAnswer)` signature — `ExerciseRenderer` still calls it, just delayed until Continue.
- `focusUi` path in `ExerciseRenderer`.
- SRS scoring logic — timing and correctness flow through unchanged.

---

## Files to create

- `components/exercises/ExerciseShell.tsx`
- `components/exercises/ExitConfirmSheet.tsx`

## Files to modify

- `lib/exercises/types.ts` — add `targetWord?`, `targetMeaning?` to `SentenceDictationExercise`
- `lib/exercises/generators/sentence-dictation.ts` — populate new fields
- `components/practice/session/ExerciseRenderer.tsx` — add result state, shell wrapper, title map
- `components/exercises/FillBlankExercise.tsx` — replace `onSubmit` → `onResult`, remove footer
- `components/exercises/SentenceDictationExercise.tsx` — replace `onSubmit` → `onResult`, remove footer
- `components/exercises/ReorderWordsExercise.tsx` — replace `onSubmit` → `onResult`, remove footer
- `components/exercises/MultipleChoiceExercise.tsx` — replace `onSubmit` → `onResult`, remove footer
- `components/exercises/SentenceContextExercise.tsx` — replace `onSubmit` → `onResult`, remove footer
- `components/exercises/MatchPairsExercise.tsx` — replace `onSubmit` → `onResult`, remove footer
- `components/practice/session/SessionExercisingBody.tsx` — wire exit confirmation sheet
