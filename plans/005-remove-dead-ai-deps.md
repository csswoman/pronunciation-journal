# Plan 005: Remove unused `ai` and `@ai-sdk/google` dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b543c9a..HEAD -- package.json`
> If `package.json` changed since this plan was written, re-verify the import
> search commands in Step 1 before proceeding.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

`ai` (v6.0.193, the Vercel AI SDK) and `@ai-sdk/google` (v3.0.80) appear in
`package.json` as production dependencies but zero source files import from
either package. The app uses `@google/genai` (Google's first-party SDK) for all
AI calls. Removing the dead packages shrinks the install footprint, eliminates
two transitive dependency trees from the lockfile, and prevents future confusion
about which AI SDK is canonical.

## Current state

- `package.json`: `"@ai-sdk/google": "^3.0.80"` (in `dependencies`)
- `package.json`: `"ai": "^6.0.193"` (in `dependencies`)
- Zero files under `app/`, `lib/`, or `components/` import from `'ai'` or
  `'@ai-sdk/google'`. Confirmed by grep — both commands return no output.
- The live AI integration uses `@google/genai` — do not touch that package.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Re-verify zero imports | `grep -r "from 'ai'\|from '@ai-sdk" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules` | no output |
| Remove packages | `pnpm remove ai @ai-sdk/google` | exit 0 |
| Type-check | `pnpm type-check` | exit 0, no errors |
| Tests | `pnpm test` | all pass |
| Design tokens | `pnpm lint:design-tokens` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope** (the only files that will change):
- `package.json` — two entries removed by `pnpm remove`
- `pnpm-lock.yaml` — updated automatically by `pnpm remove`

**Out of scope**:
- Any source file — pure dependency removal; no code changes needed.
- `@google/genai` — the active AI SDK; must remain.

## Git workflow

- Branch: `advisor/005-remove-dead-ai-deps`
- Single commit after verification passes: `chore(deps): remove unused ai and @ai-sdk/google packages`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Confirm zero import sites

Run both grep commands from the project root:

```bash
grep -r "from 'ai'" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
grep -r "from '@ai-sdk/google'" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
```

**Verify**: both commands produce no output. If either returns matches, STOP — this is a migration task, not a removal task.

### Step 2: Remove the packages

```bash
pnpm remove ai @ai-sdk/google
```

**Verify**: command exits 0. Then:
```bash
grep '"ai"\|@ai-sdk/google' package.json
```
Expected: no output.

### Step 3: Run verification suite

```bash
pnpm type-check
pnpm test
pnpm lint:design-tokens
pnpm lint
```

**Verify**: all four commands exit 0.

### Step 4: Commit

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): remove unused ai and @ai-sdk/google packages

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

## Test plan

No new tests needed — this is a dependency removal. The existing test suite
(`pnpm test`) serves as the regression harness.

## Done criteria

- [ ] `grep '"ai"\|@ai-sdk/google' package.json` returns no output
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm lint` exits 0
- [ ] Only `package.json` and `pnpm-lock.yaml` are modified (`git diff --name-only`)

## STOP conditions

- Step 1's grep returns any import matches — packages may be needed.
- `pnpm remove` fails or exits non-zero.
- `pnpm type-check` reports errors after removal — a transitive type dependency may have been provided by `ai` or `@ai-sdk/google`.
- Any file outside `package.json` and `pnpm-lock.yaml` appears in `git status`.

## Maintenance notes

If a future developer adds the Vercel AI SDK intentionally, they should
explicitly re-add it with a comment explaining the choice, since the app
already has `@google/genai` for its AI layer.
