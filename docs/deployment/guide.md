# Deployment & CI/CD Guide

## Overview

This project uses **GitHub Actions** for automated CI/CD pipelines with the following stages:

1. **CI Pipeline** (`ci.yml`) - Run on every push/PR
   - Linting & type checking
   - Security audit
   - Build validation
   - Accessibility checks

2. **Deploy Pipeline** (`deploy.yml`) - Run on main branch only
   - Database migrations
   - Vercel deployment
   - Health checks & smoke tests
   - Automatic rollback on failure

---

## Prerequisites

### GitHub Secrets (Required)

Set these in **Settings → Secrets and variables → Actions**:

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous key
VERCEL_TOKEN                   # Vercel authentication token
VERCEL_ORG_ID                  # Vercel organization ID
VERCEL_PROJECT_ID              # Vercel project ID
DATABASE_URL                   # PostgreSQL connection string (optional)
```

### Branch Protection Rules

In **Settings → Branches**, set `main` branch protection:

- ✅ Require status checks to pass before merging
  - `lint-and-test`
  - `security-audit`
  - `build`
- ✅ Require code reviews before merging (1 reviewer)
- ✅ Dismiss stale PR approvals
- ✅ Require branches to be up to date before merging

---

## CI Pipeline (`ci.yml`)

### Triggers

- Every push to any branch
- Every pull request to `main` or `develop`

### Jobs

#### 1. **lint-and-test**
Runs in parallel with security audit.

```bash
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run test -- --run # Jest (optional)
```

**Continue on error**: Lint & test failures don't block deployment (visible in logs).

#### 2. **security-audit**
Parallel with lint-and-test.

- `npm audit --audit-level=moderate`
- Checks for hardcoded secrets (Supabase keys, API keys, etc.)

#### 3. **build**
Requires: `lint-and-test` AND `security-audit` to pass.

- Builds Next.js with environment variables
- Uploads `.next/` artifact (5-day retention)

#### 4. **accessibility-audit**
Parallel with build.

- Verifies ARIA labels in interactive components
- Checks for hard-coded colors (should be < 2 in UI components)
- Fails if > 2 hard-coded `oklch()` values found

#### 5. **notify-status**
Runs last. Requires all jobs.

- Summarizes pipeline status

### Example PR Workflow

1. Push to `feature/new-button` branch
2. GitHub Actions automatically:
   - Lints code
   - Type-checks TypeScript
   - Validates design tokens
   - Runs security audit
3. Create PR → CI pipeline visible in PR checks
4. Approve & merge (if all checks pass)

---

## Deploy Pipeline (`deploy.yml`)

### Triggers

- Direct push to `main` branch
- Completion of `ci.yml` on `main`

### Pre-Deploy Validation

- **Branch protection check**: Main branch must be protected
- **Commit message check**: Skip with `[skip deploy]` in commit message
  ```bash
  git commit -m "Fix typo [skip deploy]"  # Won't trigger deploy
  ```

### Deployment Stages

#### 1. **database-migration**
Runs Supabase migrations (placeholder).

```bash
supabase migration up --db-url $DATABASE_URL
```

#### 2. **deploy-vercel**
Deploys to Vercel production environment.

- Uses Vercel Action v6.1.0
- Sets `production: true`
- Waits for deployment completion

#### 3. **smoke-test**
Basic health checks after deployment.

- Hits `/health` endpoint 5 times (retry with 10s delay)
- Requires 200 HTTP response
- Placeholder for Playwright/Cypress tests

#### 4. **rollback-on-failure**
If any stage fails, automatically rolls back.

- Reverts to previous working deployment
- Posts comment to PR/commit
- Notifies team

#### 5. **notify-success**
On successful deployment:

- Creates GitHub Deployment record
- Creates Release tag (`v{run_number}`)
- Posts success notification

### Example Deploy Workflow

```
1. Merge PR to main
   ↓
2. CI Pipeline runs (lint, test, build, audit)
   ↓
3. All checks pass
   ↓
4. Deploy Pipeline triggered
   ↓
5. Database migrations run
   ↓
6. Deploy to Vercel production
   ↓
7. Health checks pass
   ↓
8. Smoke tests pass
   ↓
9. Release tag created (v{run_number})
   ↓
✅ Deployment complete
```

---

## Manual Deployment

### Force Deploy (Bypass CI)

```bash
git commit --allow-empty -m "chore: force deploy" && git push
```

### Skip Deployment

```bash
git commit -m "docs: update README [skip deploy]"
```

### Trigger Redeployment

```bash
# Create empty commit to trigger CI/Deploy
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## Secrets & Security

### Adding New Secrets

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `NEXT_PUBLIC_*` (for client-side), or regular name (for server-only)
4. Never commit `.env.local` or `.env` files

### Accessing Secrets in Workflows

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Security Checks in CI

- ✅ No hardcoded API keys/secrets in code
- ✅ npm audit for vulnerable dependencies
- ✅ Design token validation (no rogue colors)

---

## Monitoring & Debugging

### View Workflow Logs

1. Go to **Actions** tab in GitHub
2. Click workflow name → click run
3. Expand job to see full logs

### Common Issues

#### ❌ "Lint failed"
- Fix ESLint errors: `npm run lint -- --fix`
- Commit and push: `git push`

#### ❌ "Type check failed"
- Fix TypeScript errors: Review error in build output
- Ensure types are correct: `npm run type-check`

#### ❌ "Build failed"
- Check Next.js build: `npm run build`
- Verify env variables are set
- Check for missing dependencies

#### ❌ "Deployment rolled back"
- Check Vercel logs for runtime errors
- Verify database migrations were correct
- Check environment variables in Vercel dashboard

#### ❌ "Health check failed"
- Ensure `/health` endpoint exists and returns 200
- Check Vercel deployment status
- Verify environment variables are set in Vercel

---

## Best Practices

### Commit Messages

Use conventional commits for clarity:

```bash
git commit -m "feat: add dark mode toggle"
git commit -m "fix: contrast ratio in dark theme"
git commit -m "docs: update deployment guide"
git commit -m "chore: update dependencies"
```

### PR Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes & commit regularly
3. Push: `git push -u origin feature/my-feature`
4. Create PR → CI pipeline runs automatically
5. Wait for checks to pass
6. Request review
7. Merge when approved

### Production Stability

- Always merge PRs, never force push to main
- Main branch should always be deployable
- Tag releases: `git tag -a v1.0.0 -m "Release v1.0.0"`

---

## Rollback Procedures

### Automatic Rollback (Smoke Test Failure)

The deploy pipeline **automatically rolls back** if:
- Smoke tests fail
- Health checks fail
- Deployment fails

### Manual Rollback

```bash
# Option 1: Revert the commit
git revert <commit-hash> && git push origin main

# Option 2: Redeploy previous version
# In Vercel dashboard → Deployments → click previous → "Redeploy"
```

---

## Cost & Quotas

### GitHub Actions

- Free tier: 2,000 minutes/month
- This project uses ~5-10 minutes per CI run
- Estimate: ~100-200 CI runs/month (plenty of headroom)

### Vercel

- Free tier: Unlimited deployments
- Production deployments are free
- Environment variables included

### Supabase

- Database migrations are free
- Connection pooling available for production

---

## Future Enhancements

- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Add performance benchmarks
- [ ] Add Lighthouse CI checks
- [ ] Add staging environment deployment
- [ ] Add Slack notifications
- [ ] Add Discord notifications
- [ ] Database backup before migrations
- [ ] Feature flags for gradual rollout

---

## Support

For workflow issues:
1. Check GitHub Actions logs: **Actions** tab
2. Review error messages in job output
3. Check secrets are set correctly
4. Verify branch protection rules
5. Run locally first: `npm run build`, `npm run test`

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables in Vercel dashboard
3. Check database connection string
4. Review Supabase migration logs
