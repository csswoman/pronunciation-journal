# Lexicon Review Phase — Design Spec

**Date:** 2026-05-27  
**Branch:** design-system-enforcement  
**Scope:** `/lexicon/[id]/practice` — add a flashcard review phase before exercises

---

## Problem

The current "Practice lesson" button sends the user directly into match-pairs exercises without having seen the words first. For new vocabulary this means failing every exercise without understanding why.

---

## Solution

Convert `/lexicon/[id]/practice` into a two-phase flow controlled by a single orchestrating component. Phase 1 is a flashcard review (Anki-style) that feeds the SRS. Phase 2 is the existing match-pairs exercise, filtered to only the words the user struggled with.

---

## Phase 1 — Flashcard Review

### Card interaction
1. Card shows the word (front face).
2. User taps "Reveal" to flip — shows definition, example sentence, part of speech, and audio button.
3. User rates with one of three buttons:

| Button | SM-2 grade | SRS effect | Enters Phase 2? |
|---|---|---|---|
| **No la sé** | 1 | `interval_days = 1`, `ease_factor -= 0.15` (min 1.3), `repetitions = 0`, `status = new` | ✅ yes |
| **Normal** | 3 | Standard SM-2 via `scheduleNextReview` with grade 3 | ❌ no |
| **Ya la conozco** | 5, but with `interval_days = 30` override | `ease_factor` set to 2.5 baseline, `status = mastered`, `next_review_at = +30 days` | ❌ no |

### SRS writes
- Mutations fire immediately on button press via the existing word-bank SRS path.
- For words not yet in `word_bank` (synthetic entries with `id = "lexicon:…"`), a real `word_bank` row is upserted first, then the SRS fields are updated.
- "Ya la conozco" bypasses `computeSM2` and writes fixed values directly: `interval_days = 30`, `ease_factor = 2.5`, `repetitions = 1`, `status = mastered`.

### Progress
- Progress indicator shows card N of total (e.g. "3 / 12").
- No back navigation — cards are linear.

---

## Summary Screen (between phases)

Shown after all cards are rated.

Displays three counts:
- ✗ No la sé: N
- ~ Normal: N  
- ✓ Ya la conozco: N

### Routing logic
- If **"No la sé" count = 0** → skip Phase 2, show final session summary immediately.
- If **"No la sé" count ≥ 1** → show a single CTA: **"Comenzar ejercicios"** → Phase 2.

No option to include or exclude specific words — the system decides automatically.

---

## Phase 2 — Match-Pairs Exercises

### Word pool rules

| "No la sé" count | Pool |
|---|---|
| ≥ 4 | Only "No la sé" words |
| 1–3 | "No la sé" words + filler from "Normal"-rated words of the same lesson, up to 4 total pairs |

Filler words are **distractors only** — their SRS is not modified if the user fails them in this phase.

### Failure handling in Phase 2
If the user fails a "No la sé" word in match-pairs, apply a **direct DB penalty** (no SM-2 re-run):
- `status = new`
- `interval_days = 0` (review tomorrow)
- `ease_factor = MAX(1.3, ease_factor - 0.15)`

This avoids running SM-2 twice in one session (which would artificially collapse the ease factor).

### Completion
After the match-pairs session ends, show the existing `SessionSummary` component.

---

## Architecture

### State machine
`LexiconPracticePage` controls a `phase` value:

```
loading → review → summary → practice → done
```

### New components

| Component | Responsibility |
|---|---|
| `LexiconReviewPhase` | Renders flashcard stack, emits `onComplete(ratings: WordRating[])` |
| `LexiconFlashcard` | Single card with front/back flip, 3 rating buttons |
| `LexiconReviewSummary` | Shows rating counts, "Comenzar ejercicios" or auto-advance |

### Types
```ts
type FlashcardRating = 'forgot' | 'normal' | 'known'

interface WordRating {
  entry: WordBankEntry
  rating: FlashcardRating
}
```

### Existing code reused
- `computeSM2` / `scheduleNextReview` for "Normal" ratings
- `generateMatchPairsFromWordBank` for Phase 2 exercise generation
- `PracticeSession` for Phase 2 exercise rendering
- `SessionSummary` for final summary

### No changes to
- `/api/lexicon/[id]` route — same data shape
- `PracticeSession` component
- Word-bank SRS query layer (only new call sites)

---

## Edge Cases

| Case | Behavior |
|---|---|
| Lesson has < 2 words | Error state (already handled by current code) |
| All words → "Ya la conozco" | Skip Phase 2, show summary |
| All words → "No la sé", but < 4 | Fill with "Normal" distractors up to 4 pairs |
| User exits mid-review | Ratings already written to SRS (per-button), partial state is acceptable |

---

## Out of Scope

- This flow is only for `/lexicon/[id]/practice`. The home practice page is unaffected.
- No changes to the SM-2 algorithm itself.
- No undo/back within the flashcard stack.
