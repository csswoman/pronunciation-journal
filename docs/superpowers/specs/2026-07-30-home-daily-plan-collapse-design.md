# Home daily plan: collapse future steps (mobile)

## Problem

`DailyStepList` (`components/daily/DailyStepList.tsx`) renders every step of the day's plan as a full-height row (title + subtitle + meta + CTA), with no cap. On a typical 5-step day this pushes the rest of Home (recommended reading, sound to practice) below the fold on mobile, before the user has even scrolled past the plan. Confirmed via screenshot: a 5-step plan filled the entire visible viewport below the header, with none of `HomeLearnRow` or the aside cards visible without scrolling.

## Goal

Reduce the vertical footprint of the daily plan card on mobile without losing at-a-glance context of what the rest of the day holds.

## Behavior

- The **current step** (`entry` or `current` visual state, per existing `rowVisual()` logic) renders expanded exactly as today: title, subtitle, meta line, CTA label ("Empieza aquí" / "En curso").
- The next **2 pending steps** render as **compact rows**: title + estimated time only (`≈N min`), no subtitle, no exercise/word count, reduced row height (~36px vs ~72px for the expanded row).
- **Done/resolved steps** also render compact: title + green check icon, same reduced height. They are never hidden entirely — the day's full step count stays visible so progress feels complete (per DESIGN.md "Progress is felt, not just counted").
- If pending steps remain beyond the 2 compact ones shown, a text toggle **"Ver N más"** appears at the end of the list. Clicking it reveals the remaining steps in their compact form (not full expansion — compact stays compact when revealed).
- The toggle does **not persist** across Home reloads/navigations; every fresh render of `DailyStepList` starts collapsed.
- Applies at **all breakpoints** (mobile and desktop) — same component, same behavior, no `md:` variant. Simpler than branching behavior per viewport, and the user confirmed a uniform behavior is acceptable.

## Not in scope

- No change to `HomeDailyCard`'s empty/loading/error/all-done states.
- No change to `useDailyPlan` or any data/query layer — steps already arrive fully loaded; this is purely a rendering change over the existing `steps` array.
- No change to `/daily` page's own step list rendering, only the Home instance — confirm `DailyStepList` isn't also used unmodified elsewhere in a context where full expansion is required (check callers before implementing).

## Implementation notes

- Likely lands as new local state in `DailyStepList` (`expanded: boolean`, default `false`) plus a compact-row render branch alongside the existing full row branch.
- If the compact and full row markup diverge enough to hurt readability inside `DailyStepList`, extract a `DailyStepRowCompact` (or similar) subcomponent — keep `DailyStepList` under the 250-line file limit.
- Reuse the existing `rowVisual()` classification (`done` / `entry` / `current` / `pending`) to decide expanded-vs-compact per row; no new status enum needed.
- Compact row still needs the same click/keyboard affordance as the full row (same `<button>`/`<Link>` wrapper) — only the visual density changes, not the interaction contract.
- Respect existing design tokens (`--radius-lg`, `border-subtle`, `text-fg-muted`, etc.) — no new hardcoded values.

## Testing

- Existing tests likely need updates: check `components/home/__tests__/` for any that assert all steps render as full rows.
- New test: a plan with 5 steps (1 current + 4 pending) renders 1 expanded + 2 compact + toggle; clicking toggle reveals the remaining 2 compact rows.
- New test: a plan with done steps mixed in renders them compact with check icon, not hidden.
