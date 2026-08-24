# Home Microinteractions — Design Spec

## Problem

The Aug 22 [Sound & Motion System](2026-08-22-sound-motion-system-design.md)
spec defined 6 reusable motion patterns and 13 new cues, and shipped the
**Navigation** domain. The **Home / Daily** domain was left as a named
follow-up:

> `DailyChecklist`, `HomeChunkOfDayCard`, `HomeWordOfDayCard`,
> `DailyPlanCard` — `tap`/`toggle` for checks, `streak` + `success-pulse`
> on plan completion, `list-stagger` on step lists.

This spec implements four concrete microinteractions inside that domain,
each responding to something the user actually did (never on page load,
never on navigation, per the project's existing motion rule):

1. Favorite heart (Vocabulario — `HomeWordOfDayCard`, `WordCard`)
2. Phrase/word-of-day change (`HomeWordOfDayCard`, `HomeChunkOfDayCard`)
3. Step-complete tick (`DailyStepList`)
4. Streak counter increment (`StreakChip`)

## Goals

- Reuse the existing token/keyframe system in `app/styles/animations.css`
  and the existing cue set in `lib/ui-sounds/recipes.ts` — no new
  animation library, no per-component bespoke CSS, no new Web Audio cues.
- Add exactly one new motion pattern (`heart-pop`) for the one interaction
  the existing 6 patterns don't cover. The other three reuse patterns
  already defined by the Aug 22 spec.
- Centralize the CSS re-trigger trick (forced reflow between removing and
  re-adding an animation class) in one hook, so it isn't hand-rolled per
  component.
- Coordinate sound + animation for the three interactions that are
  discrete user actions or state transitions; leave phrase-change
  animation-only (it's automatic content refresh, not a user action).

## Non-goals

- No animation on page load or route navigation.
- No animation on `DailyStepList`'s row list itself (already dense per
  project guidance — only the "Hecho" badge transition changes).
- No new cues — every sound used already exists in `RECIPES`/`UI_CUE_SOUNDS`.
- No changes to `/practice/sounds` (out of scope, unrelated domain).

## Architecture

### New token additions (`app/styles/animations.css`)

The existing token set (`--ease-out-expo`, `--ease-out-quart`, defined in
`app/globals.css` or equivalent token file) covers every current pattern.
None of them overshoot. `heart-pop` needs a spring overshoot, so two new
primitives are added:

```css
--dur-celebrate: 420ms;
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

`--dur-celebrate` names the duration already used ad hoc by patterns like
`success-glow` (400ms) and `notif-bounce` (320ms) so future celebratory
keyframes have one shared duration token instead of a new magic number
each time. `--ease-spring`'s `1.56` overshoot is the only new "magic
number" this spec introduces.

### New motion pattern: `heart-pop`

```css
@keyframes heart-pop {
  0%   { transform: scale(1); }
  35%  { transform: scale(1.32); }
  65%  { transform: scale(0.94); }
  100% { transform: scale(1); }
}
.animate-heart-pop {
  animation: heart-pop var(--dur-celebrate) var(--ease-spring);
}
```

Added to the existing `prefers-reduced-motion` block alongside the other
`.animate-*` classes.

### Reused patterns (no new CSS)

- **Step-complete tick** → `success-pulse` (Aug 22 spec), applied to the
  "Hecho" badge in `DailyStepList` in addition to the existing
  `animate-state-in` fade. `success-pulse` already exists precisely for
  "save confirmation, streak completion, milestone" — a completed step is
  the same shape of event.
- **Streak counter increment** → `notification-bounce` (Aug 22 spec),
  already scoped to "streak badges... progress counters" by name.
- **Phrase change** → already implemented correctly via
  `key={word.word}` / `key={chunk.id}` + `.animate-state-in`
  (`HomeWordOfDayCard.tsx:108`, `HomeChunkOfDayCard.tsx:155`). No changes.

### `hooks/useRetrigger.ts`

A single hook centralizes the forced-reflow re-trigger trick
(`classList.remove` → `void el.offsetWidth` → `classList.add`), since a
CSS animation class does not restart if it's already applied — the
documented cause of "the second click doesn't animate."

Two call shapes:

```ts
// 1. Imperative — fire on a user event (heart click)
const { ref, trigger } = useRetrigger<HTMLButtonElement>('animate-heart-pop')
<button ref={ref} onClick={() => { toggleFavorite(); trigger() }}>

// 2. Value-watching — fire when a tracked value increases
const ref = useRetriggerOnIncrease<HTMLSpanElement>(days, 'animate-notification-bounce')
<span ref={ref}>{days}</span>
```

`useRetriggerOnIncrease` compares the new value to the previous one via
`useRef` and only re-triggers on increase (never on decrease, never on
first mount) — this is what makes the streak counter animate specifically
on "went up," not on every render.

## Component wiring

| Interaction | Component | Hook | Animation | Sound cue |
|---|---|---|---|---|
| Favorite heart | `HomeWordOfDayCard.tsx` (Heart button), `WordCard.tsx` (Heart button) | `useRetrigger` | `.animate-heart-pop` on the `<svg>`/icon wrapper | `save` (existing) |
| Phrase change | `HomeWordOfDayCard.tsx`, `HomeChunkOfDayCard.tsx` | — (already done) | `.animate-state-in` via `key` | none (automatic, not a user action) |
| Step-complete tick | `DailyStepList.tsx` ("Hecho" badge) | `useRetrigger` (fires on status transition to `done`) | `.animate-state-in` (kept) + `.success-pulse` (added) | `toggle` (existing) |
| Streak increment | `StreakChip.tsx` | `useRetriggerOnIncrease(days, ...)` | `.animate-notification-bounce` on the day count | `streak` (existing) |

All four sounds (`save`, `toggle`, `streak`) are existing entries in
`lib/ui-sounds/recipes.ts` / `lib/ui-sounds/cues.ts` — call `playUiCue(...)`
inline at the same call site that triggers the animation, no new
plumbing needed.

## Error handling / edge cases

- `useRetriggerOnIncrease`: streak going to 0 (broken) or decreasing must
  not animate — only strictly-increasing transitions trigger.
- `useRetrigger`/`useRetriggerOnIncrease` must no-op safely if `ref.current`
  is `null` (unmounted, or component not yet rendered — e.g. `StreakChip`
  is conditionally rendered only when `current > 0`).
- Favorite heart: animate on the actual toggle-to-favorited transition,
  not on every click while a save is pending/erroring (mirrors existing
  `saveState` gating already in `HomeWordOfDayCard`).
- All new/reused classes already fall under the project's global
  `prefers-reduced-motion` handling; `heart-pop` is added to the explicit
  list in `animations.css`'s reduced-motion block (that block enumerates
  classes rather than using a blanket selector).

## Testing

- `hooks/__tests__/useRetrigger.test.ts` (new): reflow-forcing sequence,
  no-op on decrease for `useRetriggerOnIncrease`, no-op on first mount,
  null-ref safety.
- Existing component tests (`HomeChunkOfDayCard.test.tsx`,
  `HomeCommandGrid.test.tsx`, `HomePageHeader.test.tsx`) get light
  updates only if class names they assert on change — no new snapshot
  surface expected since assertions target text/roles, not animation
  classes.

## This plan's scope

Ships all four microinteractions end-to-end: token additions, one new
motion pattern, the `useRetrigger`/`useRetriggerOnIncrease` hook, and
wiring in the four components listed above. Does not touch the
Vocabulary/Decks/Journal or AI Coach/Progress domains named as further
follow-ups in the Aug 22 spec.
