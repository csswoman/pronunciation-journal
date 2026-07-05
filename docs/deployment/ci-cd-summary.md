# CI/CD Summary

## Implemented today

The repository currently contains:

```text
.github/
├── workflows/
│   └── ci.yml
└── DEPLOYMENT_SETUP.md

app/api/health/
├── route.ts
└── ready/
    └── route.ts

scripts/
└── setup-deployment.sh

docs/deployment/
├── guide.md
├── setup-guide.md
├── ci-cd-summary.md
└── setup-checklist.md
```

## What is actually active

Active automation in-repo:

- GitHub Actions CI workflow in `.github/workflows/ci.yml`
- Optional local pre-commit hook in `.githooks/pre-commit`; enable it with
  `git config core.hooksPath .githooks`

That workflow covers:

- lint
- type-check
- tests
- optional integration tests via `pnpm test:integration` when explicitly invoked
- design-token validation
- dependency audit
- hardcoded-secret scanning via `pnpm scan:secrets`
- build artifact generation
- lightweight accessibility/design checks

## What is not currently in the repo

Not implemented as checked-in automation:

- `deploy.yml`
- automatic Vercel deployment from GitHub Actions
- automatic rollback
- post-deploy smoke tests
- automatic release tagging

Some older docs in this area were written as if that pipeline already existed.
This summary reflects the current repository state as of 2026-06-21.

## Operational implications

- CI status can be enforced on pull requests today.
- Production deployment still needs to be handled manually or via external
  platform configuration.
- `app/api/health/route.ts` is a lightweight liveness signal.
- `app/api/health/ready/route.ts` performs the Supabase readiness check and can
  support future smoke tests.

## Recommended next milestone

If you want full CI/CD, the next concrete step is to add a real deploy workflow
that:

1. builds from `main`
2. deploys to the hosting provider
3. hits the readiness endpoint
4. fails fast on unhealthy deploys

For database assurance, add an optional RLS integration job that starts Supabase
local or targets an isolated staging project, then validates anon/authenticated/
service-role behavior. Keep this job gated by environment availability so unit
CI remains deterministic.
