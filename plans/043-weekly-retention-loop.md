# Plan 043: Weekly retention loop

> **Executor instructions**: Build this as a product feature after the database
> migration/RLS state is safe. Keep the session flow uninterrupted.

## Status

- **Priority**: P1 product / P2 technical
- **Effort**: M
- **Risk**: MED
- **Depends on**: RLS integration pass on staging or local
- **Category**: product-retention
- **Planned at**: 2026-07-05

## Why this matters

The app already has practice sessions, review queues, vocabulary, pronunciation
progress, and daily planning. The missing product loop is a weekly narrative:
what improved, what still needs attention, and what the learner should do next.
That gives users a reason to return without adding noisy gamification.

## Product shape

Create a weekly review surface that answers three questions:

- What improved this week?
- What should I practice next?
- Which words or sounds are becoming stable?

Keep the tone aligned with `PRODUCT.md`: adult, personal, specific, and not
cartoonish.

## Scope

**In scope**:

- Server query that aggregates the last 7 days of practice signals.
- Home/dashboard card that links into the recommended next action.
- Empty state for new users with no weekly data.
- Tests for aggregation logic.

**Out of scope**:

- Email digests.
- Push notifications.
- Streak pressure or reward loops.
- New AI generation calls unless backed by measured retention need.

## Suggested implementation

### Step 1: Define the weekly summary contract

Create a small typed view model, for example:

```ts
interface WeeklyRetentionSummary {
  practicedDays: number;
  sessionsCompleted: number;
  wordsReviewed: number;
  soundsPracticed: number;
  strongestSignal: string | null;
  nextAction: {
    label: string;
    href: string;
    reason: string;
  } | null;
}
```

Prefer deterministic aggregation over AI prose.

### Step 2: Add server query

Add a server-side query under `lib/home/` or `lib/progress/` that reads existing
session/activity/review data for the authenticated user. It should return a
small view model, not raw rows.

### Step 3: Add UI entry point

Add a compact weekly card to the authenticated home experience. It should be
visible but not dominate the first screen. The CTA should go to the highest
leverage next action: review words, practice sounds, continue daily plan, or
open progress.

### Step 4: Test

Add pure unit tests for the aggregation rules and a focused render test for the
card states.

## Verification

```bash
pnpm type-check
pnpm test -- components/home lib/home lib/progress
pnpm lint
pnpm exec next build
```

## Done criteria

- [ ] Weekly summary appears for users with recent practice.
- [ ] New users see a useful empty state.
- [ ] Next action is deterministic and route-safe.
- [ ] No new client-side data waterfall is introduced.
- [ ] Tests cover aggregation edge cases.
