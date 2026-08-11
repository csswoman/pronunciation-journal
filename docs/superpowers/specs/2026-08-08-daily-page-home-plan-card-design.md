# Daily page uses Home plan card

**Date:** 2026-08-08  
**Status:** Approved for planning  
**Goal:** Make `/daily` use the same plan-card UI as Home (`HomeDailyCard`), while keeping Daily-specific session logic and page chrome.

## Problem

Home and `/daily` both show today’s plan but through different surfaces:

| Surface | Component | Visual |
| --- | --- | --- |
| Home | `HomeDailyCard` | Card chrome (`bg-daily-card`), `PlanSegmentProgress`, collapsed steps (“Ver N más”) |
| `/daily` | `DailyChecklist` | `PageLayout` + `PageHeader`, full-expanded `DailyStepList`, fullscreen loading/error |

They share `DailyStepList` + `useDailyPlan`, but the checklist chrome diverged. Learners see two different “plan” UIs for the same data. Home is the visual source of truth.

## Decisions (from brainstorming)

1. **Shared visual component** extracted from Home (approach: extract `DailyPlanCard`).
2. **`/daily` stays a dedicated page** with its session / recap logic.
3. **Collapse on both surfaces** (`collapseFutureSteps` always on for this card).
4. **Keep Daily chrome around the card:** `PageHeader` title “Plan diario”, `SessionOpeningBanner`, free-practice link.
5. **Light practice nudge under the plan:** reuse `RecommendedPracticeCard` (not the full `/practice` hub).
6. **Out of scope:** redesign `/practice`, SRS/sync/plan generation, EN/ES copy cleanup of the free-practice link.

## Architecture

```
/daily (DailyChecklist)
  PageHeader "Plan diario"          ← keep
  SessionOpeningBanner              ← keep
  DailyPlanCard                     ← Home visual (collapsed)
  RecommendedPracticeCard           ← light practice block
  free-practice link                ← keep
  [mode step → DailyStepSession]    ← existing Daily logic
  [mode done → SessionRecapCard]    ← existing Daily logic

Home
  HomeDailyCard → thin wrapper over DailyPlanCard
  (+ onPlanStatusChange, first-session hint, reviewDue, etc.)
```

### Ownership

- **Visual source of truth:** `DailyPlanCard` (extracted from current `HomeDailyCard` markup/styles).
- **Home orchestration:** `HomeDailyCard` owns `useDailyPlan` (autoLoad false + load on user), `onPlanStatusChange`, navigation to `/daily?step=…`, Home-only empty/hint props.
- **Daily orchestration:** `DailyChecklist` owns `useDailyPlan`, in-page session view, URL/`sessionStorage` resume, celebrate → recap, recommended-practice resolution.

No double `useDailyPlan` for the same view: each surface keeps one hook instance and passes plan state into `DailyPlanCard`.

## Components

### `DailyPlanCard` (new — `components/daily/DailyPlanCard.tsx`)

Presentational. Receives an already-loaded plan:

| Prop | Role |
| --- | --- |
| `status`, `steps`, `getStepStatus`, `completedCount`, `allDone` | Plan state |
| `onStartStep` | Start/resume a step |
| `onRetry?` | Reload on error |
| `collapseFutureSteps` | Always `true` from both callers |
| `reviewDue?`, `isNewLearner?`, `showFirstSessionHint?`, `demoteEntryHighlight?` | Home-only empty/entry affordances |
| `inProgressStepId?` | Optional; card may also read via existing helper |

Renders the Home card chrome:

- `rounded-xl border border-border-subtle bg-daily-card` shell
- Internal label **“Plan de hoy”** + `PlanSegmentProgress` + progress caption
- Loading skeleton / error / empty states (Home versions — not Daily’s fixed fullscreen)
- `HomeFirstSessionHint` when enabled
- `DailyStepList` with `collapseFutureSteps`

When `allDone`, the card itself stays minimal (sr-only / empty): Home continues to replace the surface via `HomeCommandGrid`; Daily switches to `SessionRecapCard` before/instead of showing a done card.

### `HomeDailyCard`

Becomes a thin wrapper:

1. Load plan via `useDailyPlan`.
2. Compute `HomePlanStatus` and call `onPlanStatusChange`.
3. Default `onStartStep`: write `sessionStorage` + `router.push('/daily?step=…')`.
4. Render `<DailyPlanCard … collapseFutureSteps />`.

Public props for Home consumers stay stable (`conceptLesson`, `reviewDue`, `isNewLearner`, `showFirstSessionHint`, `onPlanStatusChange`).

### `DailyChecklist`

Checklist mode layout order:

1. `PageHeader` (kicker “Hoy”, title “Plan diario”, existing subtitle/progress — page-level, not inside the card)
2. `SessionOpeningBanner`
3. `DailyPlanCard` with `onStartStep` → existing in-page session (`view.mode = 'step'`, `router.replace`, storage helpers)
4. `RecommendedPracticeCard` when a recommendation resolves
5. Existing free-practice link to `/practice/sounds`

Unchanged:

- Auto-start from `initialStepId` / `?step=`
- `handleComplete` / `handleExit` / `SessionRecapCard` when `allDone`
- Streak prop for recap

Loading/error for the checklist view move into `DailyPlanCard` (Home styles). Step session and recap keep their own full-screen surfaces.

### Light practice block

- Reuse `RecommendedPracticeCard` + `resolveRecommendedMode({ fromDaily: true, arc })` (same idea as `PracticeHubClient` when `from === 'daily'`).
- Place under the plan card, above the free-practice link.
- If no `arc` / no recommendation: render nothing (link remains).
- Do **not** mount `PracticeOptionsGrid` or `SpeakWithCoachCard` on `/daily`.

## Behavior matrix

| Action | Home | `/daily` |
| --- | --- | --- |
| Start step | Navigate to `/daily?step=` | Open `DailyStepSession` in place |
| Collapse future steps | Yes | Yes |
| Plan complete | Card yields to `HomeCommandGrid` done surface | `SessionRecapCard` |
| Recommended practice card | No (Home has its own practice affordances) | Yes, when resolvable |

## Testing

- `DailyPlanCard`: loading skeleton; ready list with collapse (“Ver N más”); error retry.
- `DailyChecklist`: checklist renders card; `onStartStep` enters step mode; with arc, recommended card appears; without arc, only free-practice link.
- Home: existing `HomeCommandGrid` / plan-status behavior still passes (no visual regression of Home wiring).

## Non-goals

- Changing how the daily plan is built or synced
- Embedding the full practice hub on `/daily`
- Reworking `SessionOpeningBanner` / `SessionRecapCard` content
- Removing the `/daily` route

## File touch list (expected)

| File | Change |
| --- | --- |
| `components/daily/DailyPlanCard.tsx` | Create — extracted Home visual |
| `components/home/HomeDailyCard.tsx` | Thin wrapper over `DailyPlanCard` |
| `components/daily/DailyChecklist.tsx` | Use `DailyPlanCard` + recommended nudge; keep session/recap |
| `components/daily/__tests__/*` | Cover card + checklist wiring |
| `docs/superpowers/specs/2026-07-30-home-daily-plan-collapse-design.md` | Superseded on “Daily does not collapse” — both surfaces collapse via shared card |

## Success criteria

- Side-by-side, the plan list chrome on Home and `/daily` matches (card, segments, collapse).
- `/daily` still resumes `?step=`, runs sessions in-page, and shows recap when done.
- `/daily` shows at most one recommended practice CTA under the plan, not the full hub.
- Home plan status callback and post-plan grid behavior remain intact.
