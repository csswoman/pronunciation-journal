# AI Coach — Exercise layout & automatic coach feedback

**Date:** 2026-09-06
**Status:** Approved, ready for implementation plan

## Problem

Two issues in the AI Coach exercise flow, reported from the running app:

1. **Exercise header layout.** The dark bar at the top of `PracticeSession` centers
   the exercise title and overlays the `EJERCICIO X DE Y` counter pill with
   `position: absolute`. Long titles (e.g. `El Posesivo Con 'S (Ana'S Book · The
   Dog's Ball)`) get clipped and visually collide with the pill.

2. **Empty coach reply after completing an exercise.** When the learner finishes
   an exercise they must press **"Continuar con el Coach"** to send
   `"I completed the exercise! I got X of Y correct."`. That send already happens,
   but the coach's reply comes back **empty**. Root cause: the message contains
   the word `exercise`, which `EXERCISE_PATTERNS` in
   `lib/ai-practice/intent-detection.ts` matches → intent `exercise_request` →
   `toolChoice: "any"` → the model is forced to call a tool and forbidden from
   emitting plain text → empty bubble. This is the same class of bug fixed for
   starters (`selectionForRequest` / `starterId`), but this send is not a starter
   so it still runs through `detectIntent`.

The learner also wants the feedback to be **automatic** — no button press.

## Approved decisions

- **Feedback trigger:** Enfoque 1 — `PracticeSession` auto-fires `onComplete` via
  a guarded `useEffect` when the session finishes. No changes to
  `useStreamingChat`, `schema.ts`, or `route.ts`.
- **Empty-reply fix:** Opción X — change the message copy so it no longer contains
  `exercise` / `practice` / `quiz` / `test` / `drill`. `detectIntent` then falls
  to `conversation`, `toolChoice: "auto"`, and the coach replies in prose.
- **Summary card:** kept visible, **button removed**. The coach's message appears
  automatically below it.
- **Header layout:** two-row layout — counter pill on its own row, full title
  below with room for up to 2 lines.

Explicitly deferred (not in scope): adding an explicit `intent` flag to the send
(Enfoque 3), and hardening `EXERCISE_PATTERNS` to require an imperative verb
(Opción Y). Either can be revisited later if intent-by-inference bites again.

## Design

### 1. `SessionHeader` — two-row layout

File: `components/ai-coach/PracticeSession.tsx`

- Remove `relative` from the bar container and `absolute right-4 ...` from the pill.
- Bar becomes a vertical flex (`flex-col`) with a small gap:
  - Row 1: `EJERCICIO X DE Y` pill, left-aligned (or centered), current size/tokens.
  - Row 2: full title, `text-body-sm font-semibold text-[oklch(0.96_0.008_var(--hue))]`,
    normal wrap, `line-clamp-2` as a safety cap.
- Vertical padding relaxes from a fixed `py-3` to `py-2.5`; the bar grows in
  height only as much as the title needs.
- No token, color, or spacing-token changes — structure only.

### 2. Auto-fire completion

File: `components/ai-coach/PracticeSession.tsx`

- Add `completeSentRef = useRef(false)`.
- `useEffect` keyed on `isFinished`: when `isFinished` is `true` and
  `completeSentRef.current` is `false`, set it `true` and call
  `onComplete?.({ total, correct: correctCount })`.
- Delete `handleContinue`, the `completedSent` state, and the
  `<Button>` "Continuar con el Coach" / "Conversación continuada" block.
- The summary card (`¡Práctica finalizada!` · `X de Y ejercicios correctos` +
  encouragement line) stays, rendered without any button.

Visual sequence: last answer → 1.5 s auto-advance → summary card → hidden user
message → coach streams prose feedback. No clicks.

### 3. Message copy

Replace the completion message in both call sites so it contains none of
`exercise` / `practice` / `quiz` / `test` / `drill`:

- `components/ai-coach/AICoachPanelViews.tsx` (~line 157):
  `` `I completed the exercise! I got ${s.correct} of ${s.total} correct.` ``
  → `` `I just finished — ${s.correct} of ${s.total} right. How did I do?` ``
- `components/ai-coach/missions/MissionWorkspace.tsx` (~line 268):
  `` `I completed the exercise! (${s.correct}/${s.total} correct)` ``
  → `` `I just finished — ${s.correct}/${s.total} right. How did I do?` ``

Keep the copy identical between the two (only the separator differs today; unify
to the same phrasing).

## Data flow (after)

```
Learner answers last exercise
  → handleAnswer → 1.5s auto-advance → current >= length → isFinished === true
  → useEffect (completeSentRef guard) → onComplete({ total, correct })
  → AICoachPanelViews / MissionWorkspace: sendMessage("I just finished — X of Y right. How did I do?")
  → POST /api/gemini → detectIntent → "conversation" → toolChoice "auto" (+ annotate_turn)
  → coach streams prose feedback
Summary card remains visible above the coach message.
```

## Out of scope / unchanged

- `hooks/useStreamingChat.ts` — untouched.
- `app/api/gemini/schema.ts`, `app/api/gemini/route.ts`,
  `lib/ai-practice/intent-detection.ts` — untouched (copy fix avoids them).
- Progress persistence (`persistCoachExerciseResult`, `recordCoachSession`) —
  already driven by `answerToolCall`, unrelated.
- Offline mode — no effect (pure client + an already-existing chat message).

## Testing

- `components/ai-coach/__tests__/PracticeSession.test.tsx`:
  - Update "shows final completion feedback" — no button now; assert `onComplete`
    is called **automatically** on finish (no `user.click`) and exactly once.
  - New: a long title in `SessionHeader` renders the full title and the counter
    pill without overlap (both texts present; title not truncated to empty).
- Optional regression guard: assert the new completion copy resolves to
  `conversation` (not `exercise_request`) via `detectIntent`.
- `pnpm type-check`, `pnpm lint`, `pnpm test`.

## Files touched

| File | Change |
|---|---|
| `components/ai-coach/PracticeSession.tsx` | `SessionHeader` two-row; guarded `useEffect` auto-`onComplete`; remove button + `completedSent` state + `handleContinue` |
| `components/ai-coach/AICoachPanelViews.tsx` | Completion message copy |
| `components/ai-coach/missions/MissionWorkspace.tsx` | Completion message copy |
| `components/ai-coach/__tests__/PracticeSession.test.tsx` | Tests for auto-complete + long title |
