# Plan 042: Restore the normal production build gate

> **Executor instructions**: Follow this plan exactly. Stop on STOP conditions.
> Update `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat f47f5a13..HEAD -- components/ai-coach/PracticeSession.tsx components/ai-coach/pronunciation/RecordingControls.tsx scripts/lint-design-tokens.mjs package.json`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: ci
- **Planned at**: commit `f47f5a13`, 2026-07-05

## Why this matters

`pnpm build` currently fails before Next builds because
`lint:design-tokens` reports off-grid arbitrary sizes in AI coach components.
That forced the performance audit to use `pnpm exec next build` instead of the
normal production gate. A reliable build command is required before future
bundle work can be trusted.

## Current state

The failing command reports:

- `components/ai-coach/PracticeSession.tsx`: `w-[18px]`, `w-[6px]`,
  `h-[6px]`
- `components/ai-coach/pronunciation/RecordingControls.tsx`: `w-[3px]`

The nearest valid grid values are already printed by the linter.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Design token lint | `pnpm lint:design-tokens` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |
| Focused tests | `pnpm test -- components/ai-coach` | pass |
| Full build | `pnpm build` | exit 0 |

## Scope

**In scope**:
- `components/ai-coach/PracticeSession.tsx`
- `components/ai-coach/pronunciation/RecordingControls.tsx`
- Focused visual-safe class changes only

**Out of scope**:
- Redesigning AI coach UI
- Changing design-token linter rules
- Modifying package scripts
- Broad cleanup of unrelated arbitrary values

## Git workflow

- Branch: `codex/042-restore-production-build-gate`
- Commit: `fix(ui): align ai coach sizes to token grid`

## Steps

### Step 1: Inspect the failing elements

Open both files and identify what each arbitrary width/height controls. Choose
the nearest valid 4px-grid class that preserves intent:

- `18px` likely becomes `20px` or `16px`.
- `6px` likely becomes `8px` or `4px`.
- `3px` likely becomes `4px`.

Prefer preserving visual affordance over exact pixel matching.

### Step 2: Replace only failing classes

Change the off-grid arbitrary values to valid Tailwind classes or valid
arbitrary values accepted by the linter. Do not touch surrounding layout unless
required.

**Verify**: `pnpm lint:design-tokens` exits 0.

### Step 3: Run focused validation

Run `pnpm test -- components/ai-coach` and `pnpm type-check`.

### Step 4: Restore full build

Run `pnpm build`. This must now execute design-token lint and Next build
through the normal script.

## Test plan

- Design-token lint.
- Existing AI coach tests.
- Typecheck.
- Full production build.

## Done criteria

- [ ] No design-token violations remain for the listed files.
- [ ] `pnpm build` exits 0 without bypassing `lint:design-tokens`.
- [ ] No visual or behavior changes beyond valid grid sizing.

## STOP conditions

- The linter reports many new unrelated violations after fixing the known ones.
- Replacing a size breaks an existing test or obvious layout contract.
- Fix requires changing design token policy.

## Maintenance notes

Do not use arbitrary pixel sizes off the 4px grid unless the linter explicitly
allows the exception. Fixing this gate should be done before more performance
plans that rely on production bundle measurements.

