# Plan 030: Close curriculum gaps by level, then derive placement and checkpoint tests from the curriculum

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 62cc2fe..HEAD -- app/(authenticated)/courses lib/courses components/courses components/practice/test components/ui/ProfileSettings.tsx hooks/useUserPreferences.ts lib/users/queries.ts lib/progress/queries.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `62cc2fe`, 2026-06-22

## Why this matters

The app currently starts learners at `A1`, while the course path already exposes `A1` through `C1` and the study deck maps CEFR tracks directly to course content. That makes the curriculum the right source of truth for both teaching flow and level-gating, but the current syllabus still has gaps at the boundaries between levels. Closing those gaps first prevents the placement test from encoding a curriculum that is missing key bridge topics and avoids exposing `B1+` exercises before the user has the grammar base to handle them.

This plan does two things in order: first, make the level content internally consistent and complete enough to serve as a syllabus; second, use that syllabus to define an initial placement test plus short checkpoint tests for each level transition.

## Current state

The executor needs these facts in one place:

- `lib/courses/curriculum.ts` defines the whole course path curriculum for `A1`, `A2`, `B1`, `B2`, and `C1`, plus elective tracks.
- `lib/courses/buildCurriculum.ts` turns a flat list of lessons into a core section and an optional section.
- `app/(authenticated)/courses/page.tsx` passes the selected level into `CoursePathPage` and currently defaults to `A1` when no level is supplied.
- `app/(authenticated)/courses/study/[n]/page.tsx` maps `a1` through `c1` directly to `A1` through `C1` for the grammar study deck, and elective tracks default to `A1`.
- `components/ui/ProfileSettings.tsx` currently shows identity/security/account data only; there is no visible user level in profile.
- `hooks/useUserPreferences.ts` persists `full_name` and `avatar_url`, not CEFR level.
- `lib/users/queries.ts` already has `syncCefrLevel(userId, cefrEstimate)` and `getUserPreferences(userId, user_metadata)`-style patterns that can host a persisted level later.
- `lib/progress/queries.ts` reads `user_learning_state.state.level.cefrEstimate` and surfaces it as `coachInsights.cefrEstimate` in the progress dashboard.

Concrete excerpts the executor should verify before editing:

- `lib/courses/curriculum.ts` currently includes these examples for each level:
  - `A1`: `to be`, present simple, imperative, basic pronunciation, pronouns, and a few optional topic lessons.
  - `A2`: past simple, past continuous, present continuous, future intention, obligation, comparatives, and a single present-perfect lesson.
  - `B1`: present perfect, first conditional, passive, relative clauses, phrasal verbs, and several optional grammar topics.
  - `B2`: discourse reporting, causative, perfect past/future items, modals in the past, and advanced writing/listening topics.
  - `C1`: reductions, colloquial language, arguments, presentations, persuasion, and advanced writing.
- `app/(authenticated)/courses/page.tsx` currently does nothing more than forward `searchParams.level` into the course path view.
- `app/(authenticated)/courses/study/[n]/page.tsx` currently contains the direct mapping comment: CEFR tracks map straight to Core 1000 levels; elective tracks default to `A1`.

Repo conventions to follow:

- Keep curriculum edits centralized in `lib/courses/curriculum.ts`, with `buildLevel()` doing the structural grouping. That is the existing pattern in `lib/courses/buildCurriculum.ts`.
- Keep UI surface changes small and consistent with the existing course/profile screens. See `components/ui/ProfileSettings.tsx` and `components/progress/SkillProfileCard.tsx` for current style and data shape.
- Use the existing CEFR types from `lib/exercises/cefr.ts` or `lib/core-1000/types.ts` instead of inventing new strings.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Tests | `pnpm test` | exit 0 |
| Focused curriculum tests | `pnpm test -- lib/courses` | exit 0, new/updated curriculum tests pass |
| Focused route tests | `pnpm test -- components/courses` | exit 0, updated course-path tests pass |

## Scope

**In scope**:
- `lib/courses/curriculum.ts`
- `lib/courses/buildCurriculum.ts` only if a structural helper is needed for test generation or level metadata
- `app/(authenticated)/courses/page.tsx`
- `app/(authenticated)/courses/study/[n]/page.tsx`
- `components/ui/ProfileSettings.tsx`
- `hooks/useUserPreferences.ts`
- `lib/users/queries.ts`
- `lib/progress/queries.ts`
- `components/progress/SkillProfileCard.tsx`
- new tests under `lib/courses/__tests__/`, `components/courses/__tests__/`, or `components/ui/__tests__/` as needed

**Out of scope**:
- Any large rewrite of `app/(authenticated)/progress` or the full progress dashboard
- Any change to the phoneme exercise engine itself
- Adding audio or IPA hover behavior here; that is a separate UX task
- Changing the existing `A1` default route behavior unless it is needed to wire in the new persisted level

## Git workflow

- Branch: follow the repo convention if you create one for this work; otherwise keep the changes local until implementation is complete.
- Commit style: match the repo's existing non-conventional, imperative style seen in the existing plan index titles.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Build a curriculum gap matrix from the current course path

Read `lib/courses/curriculum.ts` and produce a per-level checklist for `A1` through `C1` with three buckets: already covered, missing bridge topics, and too-advanced topics that should move down or stay optional. Use the placement test the user pasted as a reference for what needs to exist by the time a learner reaches `B1`.

Your concrete goal here is to decide which topics are the minimum additions needed to make the curriculum a valid source of truth for level-gating. Do not write code yet. If you discover the current level definitions are too broad to support the test plan, STOP and report that the curriculum needs a schema change instead of more lesson rows.

**Verify**: write the matrix in a working note or draft and confirm each level has a short list of `P0` gaps, not just vague observations.

### Step 2: Close the bridge topics in the curriculum file

Update `lib/courses/curriculum.ts` so the essential lessons in each level cover the missing bridge topics you identified in Step 1. Prioritize `A1 -> A2 -> B1` first, because those levels determine whether the user can safely access the `B1+` exercises discussed in this thread.

Keep the existing `buildLevel()` structure intact. Add only the lessons that make the level complete enough to act as an assessment target; leave lower-priority enrichment as optional lessons. Make sure lesson titles and slugs stay consistent with the repo's naming style and existing curriculum tone.

**Verify**: `pnpm test -- lib/courses` → the curriculum tests pass, including any updated snapshots/assertions for level coverage.

### Step 3: Add curriculum-level coverage tests for the new gap rules

Create or extend tests under `lib/courses/__tests__/` so the new bridge lessons are enforced structurally. The tests should protect against regressions such as removing a key `A1` bridge topic, leaving `A2` without a present-perfect bridge, or leaving `B1` without the main transition topics.

Model the tests after the repo's existing domain tests: keep them pure, direct, and focused on the exported curriculum data rather than the UI.

**Verify**: `pnpm test -- lib/courses` → all tests in that area pass.

### Step 4: Persist an explicit CEFR level in the user profile path

Add the minimal profile plumbing so the user's detected or manually selected CEFR level can be displayed next to identity information. Reuse the existing `cefr_level` sync path in `lib/users/queries.ts` and the current `useUserPreferences()` pattern rather than inventing a parallel profile store.

If the profile data model cannot store the level without a schema or query change, STOP and report back instead of forcing the value into `user_metadata` in an ad hoc way. The profile should surface the level as a first-class preference or synced field, not as a hidden derived metric.

**Verify**: `pnpm test -- components/ui` → updated profile tests pass if you add them; otherwise `pnpm type-check` must still succeed with the new field plumbing.

### Step 5: Expose the level in `SkillProfileCard` and profile UI

Update `components/progress/SkillProfileCard.tsx` and `components/ui/ProfileSettings.tsx` so the user can see a clear level label, not just inferred progress metrics. The progress card can keep showing the derived estimate, but the profile should be the place where the user can confirm or adjust the current baseline.

Keep the presentation small and consistent with existing cards: a labeled pill or compact stat is enough. If the profile surface becomes crowded, prefer hiding advanced controls behind a compact edit action instead of expanding the page vertically.

**Verify**: `pnpm test -- components/progress` and `pnpm test -- components/ui` → updated assertions pass; `pnpm type-check` → exit 0.

### Step 6: Define the placement and checkpoint test contract from the curriculum

Using the completed curriculum, define a test model that has two modes:

- placement: a one-time baseline that assigns an initial level from `A1` through `C1`.
- checkpoint: a short test for each boundary (`A1 -> A2`, `A2 -> B1`, `B1 -> B2`, `B2 -> C1`).

The tests should be built from the curriculum content, not from a generic grammar bank. For each level, define the minimum passing knowledge and the question types allowed: objective grammar/vocabulary items first, reading next, writing last and only if you can score it deterministically.

If you cannot derive a stable scoring rule from the curriculum alone, stop and report that writing should remain advisory until the evaluation rubric is separated from the test payload.

**Verify**: produce a written contract that maps each level to its question types, pass threshold, and fallback behavior when the user fails a checkpoint.

### Step 7: Implement the first test generator or test data structure for placement

Create the smallest possible placement-test implementation that consumes the curriculum contract from Step 6. Start with a data structure or generator rather than a full interactive flow if that lets you keep the code deterministic and testable.

The key acceptance rule is that the placement test must not expose `B1+` questions before the curriculum gap work is done. If the implementation needs more content than exists in `lib/courses/curriculum.ts`, stop and report the missing lessons rather than inventing unrelated questions.

**Verify**: add unit tests for the generator/data structure and run `pnpm test` → all pass.

### Step 8: Wire level-based gating into course entry points

Once the placement/checkpoint model exists, wire the chosen level into the course path and study entry points so content at or above `B1` can be hidden or shown according to the stored level. Keep the defaults backward-compatible: if no level is stored yet, the app should continue to behave like today and start at `A1`.

Do not build a full onboarding flow in this plan. The goal here is only to make the curriculum-derived level available to existing surfaces so future UI can honor it.

**Verify**: `pnpm test -- components/courses` and `pnpm test -- app` if there are route tests, then `pnpm type-check`.

## Test plan

- Add curriculum coverage tests that assert the required bridge topics exist for each level, especially `A1`, `A2`, and `B1`.
- Add profile-level tests only if the level field is surfaced in `ProfileSettings` or `SkillProfileCard`.
- Add generator tests for placement/checkpoints once the contract is written.
- Use existing pure-data test style from `lib/courses/__tests__/build-session.test.ts` and existing component tests under `components/courses/__tests__/` as patterns.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `lib/courses/curriculum.ts` includes the missing bridge topics needed for `A1 -> B1` gating.
- [ ] New or updated tests prevent regressions in level coverage.
- [ ] The app can surface an explicit CEFR level in profile/progress instead of only implicit progress metrics.
- [ ] A written placement/checkpoint contract exists and is derived from the curriculum.
- [ ] `pnpm type-check` exits 0.
- [ ] `pnpm test` exits 0.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back if:

- The current curriculum is too underspecified to support level-based tests without changing the course data model.
- The profile cannot store or sync a CEFR level without a schema migration or query-layer change outside scope.
- A test threshold depends on writing evaluation you cannot score deterministically.
- Any in-scope file has drifted from the excerpts above.

## Maintenance notes

- Future lesson additions should be added as curriculum rows first, then mirrored into checkpoint tests. Do not let tests become a second, divergent source of truth.
- Reviewers should check that `B1+` gating uses the same CEFR labels everywhere and does not silently reintroduce the `A1` default for authenticated users with known level.
- The biggest follow-up after this plan is the actual interactive placement flow; keep that separate so the curriculum and the assessment contract stay testable on their own.
