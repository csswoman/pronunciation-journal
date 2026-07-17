# Plan 043: Add an actionable weekly retention loop to Home

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. Keep
> the existing `/progress` weekly analytics intact; this plan adds a compact
> Home decision surface, not a second analytics dashboard. If a STOP condition
> occurs, stop and report rather than improvising. When done, update this
> plan's row in `plans/README.md` unless the reviewer maintains the index.
>
> **Drift check (run first)**:
> `git diff --stat 48c5fd52..HEAD -- "app/(authenticated)/page.tsx" components/home lib/home components/progress/ThisWeekCard.tsx lib/progress/queries.ts`
> Reconcile any material change before implementation.

## Status

- **Priority**: P1 product / P2 technical
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: product-retention
- **Planned at**: commit `48c5fd52`, 2026-07-17

## Why this matters

The app already calculates weekly statistics on `/progress`, while Home shows
only quiet streak, mastered-word and minute totals. Neither surface converts
the last seven days into a deterministic recommendation explaining what the
learner should do next. A small server-rendered Home card can close that loop
without AI prose, notifications, streak pressure, or another client fetch.

## Current state

- `app/(authenticated)/page.tsx:35-54` fetches Home data in parallel with the
  local `settled()` degradation helper. It does not request a weekly summary.
- `components/home/HomeLayout.tsx:38-54` renders `HomePageHeader` and
  `HomeCommandGrid`; there is no weekly action card.
- `components/home/HomePageHeader.tsx:28-52` shows only non-zero streak,
  mastered-word and weekly-minute fragments. Preserve this concise header.
- `lib/progress/queries.ts` already computes `WeeklySummaryStats` for the
  progress page, and `components/progress/ThisWeekCard.tsx` renders exercises,
  new words and a useful empty state. Do not move this progress component into
  Home or duplicate its raw-query implementation.
- There is no `WeeklyRetentionSummary`, `strongestSignal`, or deterministic
  `nextAction` contract in `lib/home`.

## Scope

**In scope**:

- Create a pure weekly-retention model under `lib/home/`, with tests.
- Add a server-side Home query that reads only the existing activity/review
  signals needed by that model.
- Add one compact presentational card under `components/home/`, with tests.
- Wire the query into the existing parallel fetch in
  `app/(authenticated)/page.tsx` and pass the view model through `HomeLayout`.

**Out of scope**:

- Changing or removing `components/progress/ThisWeekCard.tsx`.
- Email, push notifications, streak pressure, rewards, or AI-generated prose.
- New tables, migrations, exercise types, or client-side waterfalls.
- Redirects, `/api/words`, `/test`, Reader, or audio-retention work.

## Target contract

Define a small view model such as:

```ts
interface WeeklyRetentionSummary {
  practicedDays: number
  sessionsCompleted: number
  wordsReviewed: number
  soundsPracticed: number
  strongestSignal: string | null
  nextAction: {
    label: string
    href: '/practice/review' | '/practice/sounds' | '/daily' | '/practice'
    reason: string
  } | null
}
```

The model must choose `nextAction` with pure, documented priority rules. Prefer
an outstanding review queue first, then a weak/due sound, then Daily, then the
general practice hub. Do not infer a recommendation from presentation copy.

## Steps

### Step 1: Add and test the pure recommendation model

Create a pure builder in `lib/home/` that accepts already-aggregated counts and
returns `WeeklyRetentionSummary`. Cover:

- no activity and no due work;
- word review due;
- sound work due;
- active week with no due review;
- deterministic tie-breaking;
- route values limited to the contract union.

**Verify**: `pnpm test -- lib/home` exits 0.

### Step 2: Add the server query without a waterfall

Build the required seven-day aggregates from existing tables/query helpers.
Return only the view model, never raw rows. Add the promise to the existing
`Promise.all` in `app/(authenticated)/page.tsx` using `settled()` and a typed
empty fallback. Do not await it before starting the other Home fetches.

**Verify**: query tests prove the seven-day boundary, empty data and degraded
database response; `pnpm type-check` exits 0.

### Step 3: Add the compact Home card

Create a Server Component when no interaction requires a Client Component. It
must show the strongest useful weekly signal plus one `nextAction` CTA. For a
new user, show a calm explanation and route to `/daily` or `/practice`; do not
render zero-heavy stats. Place it below the primary Home command area so it
does not compete with the main CTA.

**Verify**: focused render tests cover recent activity, empty state and every
CTA destination used by the pure model.

### Step 4: Run final checks

```powershell
pnpm test -- components/home lib/home
pnpm type-check
pnpm exec eslint "app/(authenticated)/page.tsx" components/home lib/home
pnpm build
```

Expected: all commands exit 0 and Home introduces no client-side request.

## Done criteria

- [ ] Home receives a server-rendered `WeeklyRetentionSummary` through its existing parallel fetch boundary.
- [ ] Users with recent practice see a meaningful weekly signal and one deterministic next action.
- [ ] New users see a useful zero-noise empty state.
- [ ] Recommendation routes are type-constrained and tested.
- [ ] Existing `/progress` weekly analytics remain intact.
- [ ] No AI call, new migration, or client-side data waterfall is introduced.
- [ ] Focused tests, typecheck, scoped lint and production build pass.

## STOP conditions

Stop and report if:

- A current Home component already provides the same weekly signal plus
  deterministic next action.
- Required aggregation needs a new database table or migration.
- The product owner does not want another Home card.
- The implementation would serialize raw activity rows into a Client Component.
- A verification fails twice after a reasonable correction.

## Maintenance notes

- Keep recommendation priorities in the pure model so future Home redesigns do
  not change behavior accidentally.
- If notification or email retention loops are considered later, consume this
  view model rather than duplicating aggregation logic.
