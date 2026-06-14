# Quiz & Exercise Interactivity Design

**Date:** 2026-06-14
**Surface:** `app/mini-lessons/[slug]/page.tsx` — quiz and exercise blocks
**Scope:** Add answer selection, correct/wrong feedback, score summary, and exercise check-off

---

## 1. Overview

The mini-lesson detail page currently shows quiz questions as static text with a reveal button, and exercises as plain ordered lists. This spec adds:

- **Quiz:** clickable answer options with immediate correct/wrong feedback, auto-expanded explanation, and a score summary after all questions are answered
- **Exercises:** check-off items with line-through and a checkmark icon, toggleable

No new routing, no persistence, no Supabase calls. All state is ephemeral React (`useState`), scoped to the page session.

---

## 2. Architecture

### Components changed

| Component | Change |
|-----------|--------|
| `components/mini-lessons/MiniLessonQuiz.tsx` | Rewrite: options become buttons, add selection + score state |
| `app/mini-lessons/[slug]/page.tsx` | Extract exercise blocks into new `ExerciseBlock` client component |
| `components/mini-lessons/ExerciseBlock.tsx` | New: wraps a single exercise block with check-off state |
| `app/styles/mini-lessons.css` | New classes for option states, score, and check-off |

### Why `ExerciseBlock` is a new file

The detail page is a Server Component. Exercise check-off requires `useState`. Extracting `ExerciseBlock` as a small client component keeps the page server-rendered while isolating the interactive boundary. It is not reused elsewhere at this stage.

---

## 3. Quiz Behavior

### State

```ts
const [selected, setSelected] = useState<Record<number, number>>({})
// key: question index, value: chosen option index
```

`revealed` state is removed. The explanation auto-expands on selection.

### Interaction flow

1. User sees question + options as buttons (A / B / C / D)
2. User clicks an option
3. Immediately (no delay):
   - Clicked option: green background if correct (`--success-soft`, `--success` border), red if wrong (`--error-soft`, `--error` border)
   - Correct option always highlighted green (even if user picked wrong)
   - All other options: `opacity: 0.45`, `pointer-events: none`
   - Explanation panel expands automatically (reuses existing `grid-template-rows` animation)
4. Question is locked — clicking another option does nothing
5. When `Object.keys(selected).length === questions.length`: score summary fades in below the last block

### Option button states

| State | Class | Visual |
|-------|-------|--------|
| Default | `__quiz-option` | Surface-sunken bg, border-subtle border |
| Hover (unanswered) | `:hover` | Surface-raised bg |
| Selected correct | `__quiz-option--correct` | success-soft bg, success border |
| Selected wrong | `__quiz-option--wrong` | error-soft bg, error border |
| Correct (unselected) | `__quiz-option--correct` | Same green — always shown on reveal |
| Dimmed | `__quiz-option--dimmed` | opacity 0.45, pointer-events none |

### Score summary

Appears only after all questions answered. No button required — auto-shown.

| Score | Color |
|-------|-------|
| ≥70% | success green |
| 50–69% | warning amber |
| <50% | error red |

Copy: `"3 / 4 correct"` — plain, no gamification language.

---

## 4. Exercise Check-off Behavior

### Component: `ExerciseBlock`

Props:
```ts
interface ExerciseBlockProps {
  instruction: string;
  items: string[];
}
```

### State

```ts
const [checked, setChecked] = useState<Record<number, boolean>>({})
```

Each item index maps to a boolean. Toggle on click.

### Interaction flow

1. Items render as button rows (full-width, left-aligned)
2. Left side: number (1, 2, 3…) or checkmark SVG when checked
3. Click: toggles `checked[idx]`
4. Checked state: line-through text (instant — `text-decoration` not animatable), opacity fades to 0.5 in 150ms, number → checkmark with scale-in (150ms ease-out)
5. Uncheck: reverses — checkmark → number, opacity back to 1, line-through removed

Items remain visible when checked (not hidden), so users can review completed items.

---

## 5. Animations

All transitions respect `prefers-reduced-motion: reduce` — durations collapse to 1ms.

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Option feedback (color) | background-color, border-color | 150ms | ease-out |
| Options dimming | opacity | 200ms | ease-out |
| Explanation expand | grid-template-rows | 280ms | cubic-bezier(0.22, 1, 0.36, 1) (existing) |
| Score summary appear | opacity + translateY(6px→0) | 250ms + 200ms delay | ease-out |
| Check number→icon | opacity + scale | 150ms | ease-out |
| Item text fade | opacity | 150ms | ease-out |

**Never animated:** height, width, layout properties, font-size.

---

## 6. Accessibility

- Option buttons: `aria-pressed` reflects selection state; `aria-disabled="true"` + `pointer-events: none` once question is answered (not `disabled` — preserves focusability and screen reader announcements)
- Correct option after reveal: `aria-label="[option text] — correct answer"` on the green button
- Score summary: wrapped in `role="status"` so screen readers announce it when it appears
- Exercise items: `aria-pressed={checked}` on each button row
- Checkmark SVG: `aria-hidden="true"`, number rendered as visible text for screen reader
- `prefers-reduced-motion`: all transitions collapse via media query

---

## 7. CSS conventions

- New classes follow existing BEM pattern: `mini-lessons__quiz-option`, `mini-lessons__quiz-option--correct`, etc.
- Colors use existing semantic tokens: `var(--success)`, `var(--success-soft)`, `var(--error)`, `var(--error-soft)`, `var(--warning)`, `var(--warning-soft)`
- No inline `style={{}}` — all states via CSS classes
- No hardcoded colors

---

## 8. Out of scope

- Persisting quiz results to Dexie or Supabase
- Retry / reset quiz button
- Percentage score (just X / Y)
- Exercise completion percentage
- Sound effects or haptic feedback
