# CI/CD Summary

## Implemented today

The repository currently contains:

```text
.github/
├── workflows/
│   └── ci.yml
└── DEPLOYMENT_SETUP.md

app/api/health/
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

That workflow covers:

- lint
- type-check
- tests
- design-token validation
- dependency audit
- hardcoded-secret scanning
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
- `app/api/health/route.ts` can support future smoke tests, but those tests are
  not wired into GitHub Actions yet.

## Recommended next milestone

If you want full CI/CD, the next concrete step is to add a real deploy workflow
that:

1. builds from `main`
2. deploys to the hosting provider
3. hits the health endpoint
4. fails fast on unhealthy deploys
