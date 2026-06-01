# GitHub Actions & CI/CD Setup Guide

Complete este proceso para activar el **deployment automático** de english-journal.

## 🚀 Quick Setup (5 min)

### 1. Gather Required Credentials

Necesitarás:
- **Supabase**: URL y Anonymous Key (desde Supabase dashboard)
- **Vercel**: Token y Project ID (desde Vercel settings)
- **Database URL** (opcional, solo si usas Supabase migrations)

### 2. Configure GitHub Secrets

#### Option A: Usar script automático (recomendado)

```bash
chmod +x scripts/setup-deployment.sh
./scripts/setup-deployment.sh
```

Este script te pide las credenciales interactivamente y las configura en GitHub.

#### Option B: Manual setup

1. Ve a **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Añade cada secret:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc...

Name: VERCEL_TOKEN
Value: (de https://vercel.com/account/tokens)

Name: VERCEL_ORG_ID
Value: (de https://vercel.com/account)

Name: VERCEL_PROJECT_ID
Value: (del proyecto en Vercel)

Name: DATABASE_URL (opcional)
Value: postgresql://user:pass@host/dbname
```

### 3. Configure Branch Protection

1. **Settings → Branches → Add rule**
2. Pattern: `main`
3. Checkboxes:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass
     - Select: `lint-and-test`
     - Select: `security-audit`
     - Select: `build`
   - ✅ Require code reviews (1)
   - ✅ Dismiss stale PR approvals
   - ✅ Require branches to be up to date

### 4. Test the Setup

```bash
# Create test commit to trigger CI pipeline
git commit --allow-empty -m "test: trigger CI pipeline"
git push origin main
```

Verifica en **Actions** tab que los workflows corran exitosamente.

---

## 📋 Workflow Architecture

### CI Pipeline (`.github/workflows/ci.yml`)

Ejecuta en: **Cada push y pull request**

```
┌─────────────────┐
│  Push to PR/PR  │
└────────┬────────┘
         │
    ┌────┴───────────────────┐
    │                        │
    ▼                        ▼
┌─────────────┐      ┌──────────────┐
│ Lint & Test │      │ Security     │
└────────┬────┘      └──────┬───────┘
         │                  │
         └──────┬───────────┘
                ▼
         ┌─────────────┐
         │   Build     │
         └────────┬────┘
                  │
         ┌────────┴──────────┐
         │                   │
         ▼                   ▼
    ┌─────────┐      ┌────────────┐
    │ A11y    │      │ Status OK? │
    │ Audit   │      └────────────┘
    └─────────┘
```

### Deploy Pipeline (`.github/workflows/deploy.yml`)

Ejecuta en: **Solo cuando se pushea a main y CI pasa**

```
┌──────────────────────────┐
│ Push to main + CI passes │
└────────────┬─────────────┘
             │
      ┌──────▼──────┐
      │ Pre-Deploy  │
      │ Validation  │
      └──────┬──────┘
             │
             ▼
      ┌─────────────────┐
      │ DB Migrations   │
      └─────────┬───────┘
                │
      ┌─────────▼───────┐
      │ Deploy to Vercel│
      └─────────┬───────┘
                │
      ┌─────────▼────────┐
      │ Health Checks    │
      └─────────┬────────┘
                │
      ┌─────────▼────────┐
      │ Smoke Tests      │
      └─────────┬────────┘
                │
    ┌───────────┴────────────┐
    │                        │
    ▼                        ▼
┌──────────┐          ┌──────────┐
│ Success  │          │ Rollback │
│ Release  │          │ + Notify │
└──────────┘          └──────────┘
```

---

## 🔐 Security Best Practices

### Environment Variables

```javascript
// ✅ GOOD: Use in build-time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ❌ BAD: Hardcode secrets
const apiKey = "eyJhbGc..."; // Never do this!

// ✅ GOOD: Use for server-only
// In server action or API route
const dbUrl = process.env.DATABASE_URL;
```

### Secrets in Workflows

```yaml
# ✅ GOOD: Reference secrets
env:
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

# ❌ BAD: Hardcode in workflow
env:
  VERCEL_TOKEN: vercel_xxx_yyy_zzz
```

### Branch Protection

- Main branch requiere **1 code review**
- Status checks deben pasar
- Ramas deben estar actualizadas

---

## 🐛 Troubleshooting

### ❌ "Workflow failed: lint-and-test"

```bash
# Run locally first
npm run lint -- --fix
npm run type-check
git add . && git commit -m "fix: lint errors"
git push
```

### ❌ "Deployment failed"

1. Check **Actions** → workflow → job logs
2. Verify Vercel project ID in secrets
3. Verify environment variables in Vercel dashboard
4. Check database migrations for errors

### ❌ "Health check timeout"

1. Ensure `/health` endpoint exists
2. Check Vercel deployment logs
3. Verify database connectivity
4. Check timeout (5s) - puede ser insuficiente

### ❌ "Secrets not found"

```bash
# List secrets
gh secret list

# Re-add a secret
gh secret set VERCEL_TOKEN
# Paste token, Ctrl+D (or Cmd+D on Mac)
```

### ❌ "PR checks stuck"

1. Go to **Actions** → problematic workflow
2. Click **Re-run all jobs**
3. Or, push a new commit to the branch

---

## 📈 Monitoring

### View Workflow Runs

```bash
# List recent workflow runs
gh run list --repo karla-agraz/english-journal

# Watch specific workflow
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### Vercel Deployments

- Go to **Vercel Dashboard → Deployments**
- Each GitHub push creates a new deployment
- Production URL: https://english-journal.vercel.app

---

## 🚀 Deployment Commands

### Skip Deployment

```bash
git commit -m "docs: update README [skip deploy]"
```

The `[skip deploy]` flag prevents the deploy pipeline from running.

### Force Manual Deployment

```bash
# In Vercel Dashboard → Deployments → Re-deploy previous
# Or, trigger via webhook in GitHub Actions
```

### Rollback

```bash
# Option 1: Revert commit
git revert <commit-hash>
git push origin main

# Option 2: Manual rollback in Vercel
# Dashboard → Deployments → Click older deployment → Redeploy
```

---

## 📊 Cost Implications

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| GitHub Actions | 2,000 min/mo | ~100-200 CI runs × 5min = 500-1000 min | Free |
| Vercel | ∞ deployments | Unlimited | Free |
| Supabase | 500 MB DB | Included | Free (or pro) |

**Total: Free** ✅

---

## ✨ Next Steps

1. ✅ Run setup script or manual config
2. ✅ Configure branch protection
3. ✅ Test with empty commit
4. ✅ Review [guide.md](guide.md) for details
5. ✅ Start merging feature branches!

---

## 📖 Documentation

- **[guide.md](guide.md)**: Comprehensive guide
- **ci.yml**: CI pipeline configuration
- **deploy.yml**: Deploy pipeline configuration
- **scripts/setup-deployment.sh**: Automated setup

## 💬 Questions?

Check the **Actions** tab for logs and errors. Each job has detailed output that helps debug issues.
