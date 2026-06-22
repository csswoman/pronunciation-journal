# Deployment & CI/CD Guide

## Current repo state

This repository currently includes one implemented GitHub Actions workflow:
`.github/workflows/ci.yml`.

That workflow runs:

- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm lint:design-tokens`
- `pnpm audit --audit-level=moderate`
- secret-pattern checks
- `pnpm build`
- a lightweight accessibility/design-quality audit

There is currently no `deploy.yml` workflow in the repository. Any references to
automatic production deploys, rollback, release tagging, or smoke-test driven
deploy orchestration should be treated as planned work, not present behavior.

## CI workflow

### Triggers

`ci.yml` runs on:

- push to `main`
- push to `develop`
- push to `feature/**`
- pull requests targeting `main` or `develop`

### Jobs

1. `lint-and-test`
   Runs install, lint, type-check, tests, and design-token validation.

2. `security-audit`
   Runs `pnpm audit --audit-level=moderate` and scans `components/`, `app/`,
   and `lib/` for obvious hardcoded secret patterns.

3. `build`
   Depends on `lint-and-test` and `security-audit`, then runs `pnpm build` and
   uploads `.next/` as an artifact.

4. `accessibility-audit`
   Runs separate grep-based checks for accessibility patterns and hardcoded UI
   colors.

5. `notify-status`
   Fails the workflow if required upstream jobs did not succeed.

## Required GitHub secrets for CI

The `build` job injects:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Set these in GitHub under `Settings -> Secrets and variables -> Actions`.

If you later automate deployment from GitHub, you will also need deployment
secrets such as Vercel credentials, but they are not consumed by the current
workflow.

## Local verification

Run the same core checks locally before opening a PR:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm lint:design-tokens
pnpm build
```

Use Node `24.x`, matching `package.json`.

## Manual deployment guidance

Production deployment is currently documented as a manual/infrastructure task
outside the checked-in GitHub workflow set.

Recommended baseline:

1. Configure production environment variables in the hosting platform.
2. Verify `/api/health` or the exposed health route after deployment.
3. Keep Supabase auth redirect URLs aligned with `NEXT_PUBLIC_SITE_URL`.
4. Run the local verification commands before promoting changes.

## Health endpoint

The repository includes `app/api/health/route.ts`.

Current behavior:

- returns `503` when `NEXT_PUBLIC_SUPABASE_URL` or
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing
- probes the Supabase REST endpoint with a short timeout
- returns `200` when connectivity looks healthy

This endpoint is useful both for manual checks and for any future deploy
automation.

## Branch protection

Recommended protection for `main`:

- require pull requests before merge
- require CI checks to pass
- require at least one review
- require branches to be up to date before merge

Use the actual job names exposed by the current workflow when configuring
required checks.

## Known gaps

- no checked-in deploy workflow
- no smoke-test or end-to-end deployment validation
- no automatic rollback
- no staging environment workflow
- accessibility audit is grep-based and should not be treated as full coverage

## Suggested next steps

- add a real `deploy.yml` if GitHub-managed deploys are desired
- add E2E smoke tests before automating production promotion
- replace grep-based accessibility checks with deterministic test coverage
