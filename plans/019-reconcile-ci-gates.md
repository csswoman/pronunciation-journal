# Plan 019: Make the current CI gates fail on broken lint, tests, audit, and token checks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 0e25aca..HEAD -- .github/workflows/ci.yml plans/README.md`
> If any in-scope file changed since this plan was written, compare the
> excerpts below against the live code before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `0e25aca`, 2026-06-21

## Why this matters

`plans/README.md` says plan 001 fixed CI gating, but the current workflow still
uses `continue-on-error` for important checks. That means the repo can show a
green or partially green workflow while lint, tests, audit, or design-token
validation failed. Every other improvement plan relies on CI being a trustworthy
baseline.

## Current state

- `.github/workflows/ci.yml` defines lint, test, security audit, build, and a11y
  jobs.
- Lint is non-blocking:

```yaml
# .github/workflows/ci.yml:29-31
- run: pnpm lint
  name: Run ESLint
  continue-on-error: true
```

- Tests are non-blocking:

```yaml
# .github/workflows/ci.yml:36-38
- run: pnpm test
  name: Run tests
  continue-on-error: true
```

- Security audit and secret grep are non-blocking:

```yaml
# .github/workflows/ci.yml:60-72
- name: Run pnpm audit
  run: pnpm audit --audit-level=moderate
  continue-on-error: true
```

- Design token validation is currently implemented by grepping build output,
  which is fragile because `pnpm build` already runs `lint:design-tokens` from
  `package.json`.

Repo commands verified during audit:

- `pnpm type-check` exits 0 locally.
- `pnpm test` exits 0 locally: 100 test files, 700 tests.
- `pnpm lint` exits 0 locally but reports 23 warnings.
- Local Node is 22, while `package.json` requires Node 24.x; CI already uses
  Node 24.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0; warnings are acceptable unless this plan explicitly makes warnings fatal |
| Tests | `pnpm test` | all tests pass |
| Design token check | `pnpm lint:design-tokens` | exit 0 |

## Scope

**In scope**:

- `.github/workflows/ci.yml`
- `plans/README.md`

**Out of scope**:

- Do not fix the 23 lint warnings in this plan.
- Do not change ESLint rules.
- Do not change package versions or lockfiles.
- Do not rewrite the entire CI pipeline.

## Git workflow

- Branch: `codex/019-reconcile-ci-gates`
- Commit message: `ci: make validation gates blocking`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Remove non-blocking behavior from core checks

In `.github/workflows/ci.yml`, remove `continue-on-error: true` from:

- `Run ESLint`
- `Run tests`
- `Run pnpm audit`
- `Check for hardcoded secrets`
- `Verify design tokens used`

Keep informational `echo` statements, but a failing check must produce a failing
job.

**Verify**: inspect the workflow and confirm those steps no longer include
`continue-on-error`.

### Step 2: Make design-token validation direct

Replace the current build-output grep step:

```yaml
run: pnpm build 2>&1 | grep -E "design token|token violations"
```

with:

```yaml
run: pnpm lint:design-tokens
```

Do not run a production build in this validation job just to check tokens; the
build job already covers `pnpm build`.

**Verify**: `pnpm lint:design-tokens` -> exit 0.

### Step 3: Reconcile plan 001 status text

Update `plans/README.md` row 001 so it no longer says the CI fix is simply
DONE if the current branch did not contain the fix. Recommended status:

`SUPERSEDED by 019` is not an allowed status, so use:

`REJECTED (superseded by current CI drift; see 019)`

Keep plan 019 as the active TODO until this plan is implemented.

**Verify**: `Select-String -Path plans/README.md -Pattern '019|001'` shows both
the historical row and the new active row.

### Step 4: Run local verification

Run:

- `pnpm type-check`
- `pnpm lint`
- `pnpm test`
- `pnpm lint:design-tokens`

Expected: all exit 0. If local Node 22 emits an engine warning, note it in the
final report; do not change Node configuration in this plan.

## Test plan

This is a CI workflow change, so there are no unit tests to add. The verification
is the four local commands above plus workflow inspection.

## Done criteria

- [ ] Core CI checks no longer use `continue-on-error`.
- [ ] Design-token validation runs `pnpm lint:design-tokens` directly.
- [ ] `plans/README.md` contains row 019 and marks the stale 001 status honestly.
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test`, and `pnpm lint:design-tokens`
  exit 0 locally.

## STOP conditions

Stop and report if:

- A removed `continue-on-error` exposes a command that currently exits non-zero.
- The workflow has changed enough that the line excerpts above no longer match.
- Fixing CI requires changing package versions, ESLint config, or test code.

## Maintenance notes

CI should be boring and strict. If the team wants non-blocking audit or design
quality checks, put them in a separate explicitly informational job instead of
letting required jobs pass through failures.
