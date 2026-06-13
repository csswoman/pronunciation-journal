# Plan 001: Make CI actually gate — remove `continue-on-error` and fix everything that turns red

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b543c9a..HEAD -- .github/workflows/ci.yml vitest.config.ts package.json lib/daily/__tests__/streak.test.ts lib/practice/__tests__/queries.integration.test.ts`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED (turns advisory checks into hard gates; mitigated because every gate was verified green locally before writing this plan)
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

Every quality step in CI (`pnpm lint`, `pnpm test`, design-token validation, `pnpm audit`, secrets scan, hardcoded-color check) carries `continue-on-error: true`, so the pipeline passes no matter what fails — CI is advisory-only and verifies nothing. Worse, the push trigger lists a branch named `develop` that does not exist in this repo (the active development branch is `dev`), so CI does not even run on day-to-day pushes. After this plan, a failing test, lint error, token violation, or committed secret fails the pipeline, and the pipeline runs on the branches that are actually used.

The flags were not added casually: two steps are genuinely red today and two more are booby-trapped. This plan fixes those four root causes first, then removes the flags.

## Current state

All facts below were verified locally at commit `b543c9a` on 2026-06-11.

### Files involved

- `.github/workflows/ci.yml` — the only workflow. Jobs: `lint-and-test`, `security-audit`, `build`, `accessibility-audit`, `notify-status`.
- `vitest.config.ts` — vitest config; `include: ["**/__tests__/**/*.test.{ts,tsx}"]`, `environment: "node"`, alias `"@" → repo root`. No `exclude` beyond defaults, no `server-only` handling.
- `package.json` — scripts: `"test": "vitest run"`, `"lint": "eslint ."`, `"type-check": "tsc --noEmit"`, `"lint:design-tokens": "node scripts/lint-design-tokens.mjs"`, `"build": "npm run lint:design-tokens && next build"`. Package manager `pnpm@11.5.0`; `pnpm-lock.yaml` exists (there is NO package-lock.json).
- `lib/daily/__tests__/streak.test.ts` — pure-logic tests; fails at *import time*, see below. Do not modify this file.
- `lib/practice/__tests__/queries.integration.test.ts` — integration test requiring real Supabase env vars. Do not modify this file.

### Verified local baseline (the executor should reproduce this in step 0)

| Command | Result at planning time |
|---|---|
| `pnpm type-check` | exit 0 |
| `pnpm lint` | exit 0 (48 warnings, 0 errors — eslint only fails on errors) |
| `pnpm lint:design-tokens` | exit 0, prints "No design token violations found." |
| `pnpm audit --audit-level=moderate` | "No known vulnerabilities found" |
| `pnpm test` | **FAILS** — 2 failed suites, 19 passed, 249 tests passed |

### Failure 1: `lib/daily/__tests__/streak.test.ts`

Fails at import: the test imports pure helpers from `lib/daily/streak.ts`, but that module's first line is `import { createSupabaseServerClient } from '@/lib/supabase/server'`, and `lib/supabase/server.ts:1` is `import "server-only";`. The `server-only` package throws on import outside a React Server Component:

```
Error: This module cannot be imported from a Client Component module.
It should only be used from a Server Component.
```

The test itself never calls the Supabase function — only `computeStreakFromTimestamps`, `toLocalDateString`, `DAILY_STREAK_THRESHOLD`. Fix is to alias `server-only` to an empty stub in vitest config (standard practice for Next.js + vitest).

### Failure 2: `lib/practice/__tests__/queries.integration.test.ts`

Throws at module scope when `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are not set (they never are in CI). The file's own docblock states:

```
These tests are intentionally excluded from the default unit-test suite
(they hit the network) and should be run manually or in a dedicated CI step.
```

…but the exclusion was never implemented — `vitest.config.ts`'s include pattern `**/__tests__/**/*.test.{ts,tsx}` matches it. Fix is to exclude `**/*.integration.test.*` from the default run and add a dedicated script.

### Booby-trap 1: the secrets-scan step pattern is wrong

`.github/workflows/ci.yml:68-76` greps for `NEXT_PUBLIC_SUPABASE_KEY\|GEMINI_API_KEY\|service_role`. Verified locally: this matches **10 legitimate lines**, all of the form `process.env.GEMINI_API_KEY` in `app/api/**` and `lib/word-bank/gemini.ts` — i.e. it flags the *correct* way to read secrets. Ungating it as-is fails every run. A value-based pattern (`AIza[0-9A-Za-z_-]{30}` for Google API keys, `eyJhbGciOi` for JWTs such as Supabase keys, `sb_secret_` for new-style Supabase secret keys) was verified to return **0 matches** on current source.

### Booby-trap 2: the design-token step is broken by construction

`.github/workflows/ci.yml:42-44`:

```yaml
      - name: Design Token Validation
        run: pnpm build 2>&1 | grep -E "design token|token violations"
        continue-on-error: true
```

GitHub Actions runs steps with `bash -e -o pipefail`, so when the build is clean and `grep` finds nothing, grep exits 1 and the step *fails on success*. It also runs a full `pnpm build` (which needs Supabase env vars not provided in this job) just to grep its output, duplicating the `build` job. The repo already has a dedicated command with correct exit semantics: `pnpm lint:design-tokens` (exits 0 when clean — verified; `scripts/lint-design-tokens.mjs` exits 1 on violations).

### Other verified facts

- Branch trigger `.github/workflows/ci.yml:5` is `branches: [main, develop, "feature/**"]`. Verified via `git branch -a`: no `develop` branch exists; the active development branch is `dev`.
- `notify-status` job (`ci.yml:144-157`) checks only `needs.lint-and-test.result`, ignoring the other three jobs it `needs`.
- The hardcoded-color check in `accessibility-audit` (`ci.yml:134-142`) was verified green: `grep -r "oklch(0\." components/ui --include="*.tsx" | grep -v "var(--hue)" | wc -l` → 0.
- `vitest.setup.ts` exists at repo root (jsdom-conditional RTL cleanup) — leave it alone.

### The six `continue-on-error: true` occurrences to remove

Lines 33 (`pnpm lint`), 40 (`pnpm test`), 44 (design tokens), 66 (`pnpm audit`), 76 (secrets scan), 142 (hardcoded colors) of `.github/workflows/ci.yml`.

### Repo conventions

- Commit style: conventional commits — recent examples from `git log`: `fix(practice): responsive filter bar and bento grid for mobile`, `feat(db): add migration for General American accent data seed`. Use `fix(ci): …` / `test(vitest): …` style.
- TypeScript everywhere; vitest config is TS (`vitest.config.ts`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 (fresh worktrees have no node_modules — run this first) |
| Typecheck | `pnpm type-check` | exit 0 |
| Unit tests | `pnpm test` | exit 0, 20 test files passed, 0 failed |
| Single suite | `pnpm vitest run lib/daily/__tests__/streak.test.ts` | all tests pass |
| Lint | `pnpm lint` | exit 0 (warnings OK) |
| Design tokens | `pnpm lint:design-tokens` | exit 0, "No design token violations found." |

Note: this machine is Windows; run commands through bash (Git Bash) or PowerShell — both work with pnpm. For grep-style verifications, a file-content search tool is equivalent.

**Worktree gotcha (learned 2026-06-11)**: agent worktrees on this machine are
created from the repo's *default branch* (`main`), not from `dev`. This plan
targets `dev` at `b543c9a`. Any executor must first run
`git checkout -B advisor/001-ci-gate-on-failures b543c9a` and confirm
`git log -1 --oneline` shows `b543c9a` before Step 0 — on `main`'s older
snapshot the baseline will not match (20 test files, `daily-plan.test.ts` red).

## Scope

**In scope** (the only files you should modify or create):
- `.github/workflows/ci.yml`
- `vitest.config.ts`
- `vitest.stub-server-only.ts` (create — empty module stub)
- `package.json` (add one script: `test:integration`)
- `plans/README.md` (status row — only if no reviewer maintains it)

**Out of scope** (do NOT touch, even though they look related):
- `lib/daily/streak.ts` and `lib/daily/__tests__/streak.test.ts` — do not split the module or edit the test; the stub alias is the whole fix. (A separate timezone fix for this file is planned elsewhere.)
- `lib/practice/__tests__/queries.integration.test.ts` — its env guard is correct; exclusion happens in vitest config, not in the file.
- The 48 eslint warnings — they do not fail `pnpm lint`; cleaning them is not this plan.
- `vitest.setup.ts` — needs no changes.
- Any application source under `app/`, `components/`, `lib/`, `hooks/`.

## Git workflow

- Branch: `advisor/001-ci-gate-on-failures` (create from current HEAD in the worktree)
- One commit per step or one final commit; conventional-commit message, e.g. `fix(ci): enforce lint, tests, tokens and audits as hard gates`
- Do NOT push or open a PR.

## Steps

### Step 0: Install and reproduce the baseline

Run `pnpm install`, then `pnpm test`.

**Verify**: `pnpm test` fails with exactly 2 failed suites: `lib/daily/__tests__/streak.test.ts` (server-only import error) and `lib/practice/__tests__/queries.integration.test.ts` (missing env vars). Expected totals: 21 test files (2 failed, 19 passed).

**Contingency** (added 2026-06-11 after a first execution attempt saw a
non-reproducible third failure in `lib/practice/__tests__/daily-plan.test.ts`;
that suite was verified green in a clean checkout of `b543c9a`): if any suite
beyond the two named fails, do NOT stop immediately. First re-run the full
`pnpm test` once, and run the unexpected suite in isolation
(`pnpm vitest run <file>`). If the extra failure reproduces in either re-run,
STOP and include in your report: the full vitest failure output,
`git log -1 --oneline`, `git status --short`, and the total test-file count.
If it does not reproduce, record it as a flake in NOTES and continue.

### Step 1: Stub `server-only` for vitest

Create `vitest.stub-server-only.ts` at the repo root containing exactly:

```ts
// Empty stub aliased in vitest.config.ts — the real "server-only" package
// throws outside React Server Components, which breaks unit tests that
// import pure helpers from server modules.
export {};
```

In `vitest.config.ts`, add the alias alongside the existing `"@"` entry:

```ts
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "vitest.stub-server-only.ts"),
    },
  },
```

**Verify**: `pnpm vitest run lib/daily/__tests__/streak.test.ts` → suite runs and all its tests pass (no "Client Component" error).

### Step 2: Exclude integration tests from the default suite

In `vitest.config.ts`, import `configDefaults` from `vitest/config` and add to the `test` block:

```ts
    exclude: [...configDefaults.exclude, "**/*.integration.test.*"],
```

In `package.json` scripts, after `"test:watch"`, add:

```json
    "test:integration": "vitest run --config vitest.config.ts lib/practice/__tests__/queries.integration.test.ts",
```

(The `--config` flag alone does not bypass `exclude`; vitest applies `exclude` to explicit file args too in some versions. If the integration test is skipped/excluded when running `pnpm test:integration`, change the script to pass `--exclude ""` is NOT valid — instead use: `"test:integration": "vitest run lib/practice/__tests__/queries.integration.test.ts --testNamePattern=.*"` and if it still reports "No test files found", define the script as a separate config-less invocation: `"test:integration": "vitest run lib/practice/__tests__/queries.integration.test.ts --config vitest.integration.config.ts"` with a minimal config file that has no exclude. Only do this fallback if the simple form fails; report which form you used in NOTES.)

**Verify**:
1. `pnpm test` → exit 0; reports 20 passed test files, 0 failed; total tests ≥ 249. The integration file must not appear in the run.
2. `pnpm test:integration` (without Supabase env vars) → the suite is *found* and fails with "Integration tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY". That error proves the script targets the file correctly; it is the expected outcome on a machine without credentials.

### Step 3: Fix the broken CI steps in `.github/workflows/ci.yml`

Make these edits (do not reorder jobs or change anything not listed):

3a. Line 5 — replace the nonexistent branch: `branches: [main, dev, "feature/**"]`

3b. Replace the Design Token Validation step (lines 42–44) with:

```yaml
      - name: Design Token Validation
        run: pnpm lint:design-tokens
```

3c. Replace the secrets-scan step body (lines 68–76) with a value-based pattern:

```yaml
      - name: Check for hardcoded secrets
        run: |
          if grep -rEn "AIza[0-9A-Za-z_-]{30}|eyJhbGciOi|sb_secret_" \
            --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
            components/ app/ lib/ 2>/dev/null; then
            echo "❌ Hardcoded secret value detected"
            exit 1
          fi
          echo "✓ No hardcoded secret values found"
```

3d. Fix `notify-status` (lines 150–157) to gate on all four jobs:

```yaml
      - name: Check workflow status
        run: |
          if [ "${{ needs.lint-and-test.result }}" != "success" ] || \
             [ "${{ needs.security-audit.result }}" != "success" ] || \
             [ "${{ needs.build.result }}" != "success" ] || \
             [ "${{ needs.accessibility-audit.result }}" != "success" ]; then
            echo "❌ CI Pipeline failed"
            exit 1
          fi
          echo "✅ CI Pipeline passed"
```

**Verify**: file content check — searching `.github/workflows/ci.yml` for `develop` returns 0 matches and for `pnpm build 2>&1` returns 0 matches.

### Step 4: Remove all `continue-on-error` flags

Delete every `continue-on-error: true` line from `.github/workflows/ci.yml` (after step 3 there are 6: lint, test, design tokens, audit, secrets scan, hardcoded colors).

**Verify**: searching `.github/workflows/ci.yml` for `continue-on-error` returns 0 matches.

### Step 5: Re-run every gate locally exactly as CI will

Run, in order: `pnpm lint` → `pnpm type-check` → `pnpm test` → `pnpm lint:design-tokens` → `pnpm audit --audit-level=moderate` → the secrets grep from step 3c → the oklch grep: `grep -r "oklch(0\." components/ui --include="*.tsx" | grep -v "var(--hue)" | wc -l`.

**Verify**: lint/type-check/test/tokens exit 0; audit reports no vulnerabilities; secrets grep finds nothing (the `if` would not trigger); oklch count ≤ 2.

## Test plan

No new test files. The deliverable is the previously-broken suite now running:

- `lib/daily/__tests__/streak.test.ts` — existing tests, must pass (they were unreachable before).
- Full suite: `pnpm test` → 20 files passed, 0 failed, ≥ 249 tests.
- Negative check: `pnpm test` output must NOT list `queries.integration.test.ts`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm test` exits 0 with 20 passed test files, 0 failed
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm lint:design-tokens` exits 0
- [ ] `.github/workflows/ci.yml` contains zero occurrences of `continue-on-error`
- [ ] `.github/workflows/ci.yml` contains zero occurrences of `develop`
- [ ] The secrets-scan pattern `AIza[0-9A-Za-z_-]{30}|eyJhbGciOi|sb_secret_` finds 0 matches in `components/ app/ lib/`
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated (skip if the reviewer maintains the index)

## STOP conditions

Stop and report back (do not improvise) if:

- Step 0's baseline shows different failures than the two suites named above (the codebase drifted — fixing other red tests is not in scope).
- After step 1, `streak.test.ts` still fails for a reason other than `server-only` (e.g. `next/headers` throwing at import) — the stub approach needs rethinking, not patching.
- After step 2, `pnpm test` fails with any suite other than zero (a unit test is genuinely red — that is a bug fix outside this plan's scope).
- The secrets grep in step 5 finds a real match (a secret value in source) — report the file:line and credential type, do NOT paste the value, and do not "fix" it by deleting the line.
- Any fix appears to require editing `lib/daily/streak.ts`, the test files, or application source.

## Maintenance notes

- **`pnpm audit` is now a hard gate at `--audit-level=moderate`.** A new advisory in any dependency will fail CI even if unrelated to a PR. If this becomes noisy, raise to `--audit-level=high` rather than re-adding `continue-on-error`.
- The `server-only` stub applies to all vitest runs. If someone writes a test that *should* verify server-only enforcement, it can't — acceptable trade-off, note it in that test.
- Integration tests are now opt-in via `pnpm test:integration` with real Supabase credentials. If a dedicated CI job for them is ever added, it needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as secrets — scope them to a protected environment.
- Reviewer should scrutinize: the ci.yml diff line-by-line (YAML indentation errors fail the whole workflow file silently — GitHub just skips it), and that the vitest `exclude` didn't accidentally swallow non-integration suites (file count must stay 20).
- Deferred out of this plan: cleaning the 48 eslint warnings; a `develop`→`dev` rename in branch-protection rules on GitHub (web UI, not repo code); CI caching improvements.
