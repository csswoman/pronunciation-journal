# ✅ CI/CD Setup Checklist

Complete this checklist to activate your automated deployment system.

---

## 📋 Before You Start

- [ ] You have GitHub repo access
- [ ] You have Vercel account (free tier OK)
- [ ] You have Supabase project (free tier OK)
- [ ] You have GitHub CLI (`gh`) installed
  ```bash
  # Check if installed
  which gh
  
  # If not, install from https://cli.github.com
  ```

---

## 🔑 Step 1: Gather Credentials (5 min)

### Supabase

- [ ] Go to [Supabase Dashboard](https://app.supabase.com)
- [ ] Select your project
- [ ] **Settings → API**
- [ ] Copy:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Save these somewhere temporarily (only during setup)

### Vercel

- [ ] Go to [Vercel Dashboard](https://vercel.com)
- [ ] Click your project
- [ ] Copy `Project ID` → `VERCEL_PROJECT_ID`
- [ ] Go to **Settings → Tokens**
- [ ] Create new token → `VERCEL_TOKEN`
- [ ] Go to **Account Settings → Team Settings**
- [ ] Copy Team ID → `VERCEL_ORG_ID`
- [ ] (Optional) **Settings → Environment Variables**
- [ ] Copy `DATABASE_URL` if you have it

---

## 🔐 Step 2: Configure GitHub Secrets (5 min)

### Option A: Automatic (Recommended)

```bash
# Make script executable
chmod +x scripts/setup-deployment.sh

# Run interactive setup
./scripts/setup-deployment.sh
```

The script will:
1. Ask for each credential
2. Verify you're authenticated with GitHub
3. Configure all secrets automatically

- [ ] Script completed successfully

### Option B: Manual

If you prefer manual setup:

1. [ ] Go to GitHub: **Settings → Secrets and variables → Actions**
2. [ ] Click **New repository secret**
3. [ ] Add each secret:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc...

Name: VERCEL_TOKEN
Value: (your token from Vercel)

Name: VERCEL_ORG_ID
Value: (your team ID from Vercel)

Name: VERCEL_PROJECT_ID
Value: (your project ID from Vercel)

Name: DATABASE_URL (optional)
Value: postgresql://user:pass@host/dbname
```

### Verify

```bash
# List all secrets
gh secret list
```

Expected output:
```
VERCEL_TOKEN                     Updated 2024-05-29
VERCEL_ORG_ID                    Updated 2024-05-29
VERCEL_PROJECT_ID                Updated 2024-05-29
NEXT_PUBLIC_SUPABASE_URL         Updated 2024-05-29
NEXT_PUBLIC_SUPABASE_ANON_KEY    Updated 2024-05-29
```

- [ ] All 5 secrets appear in the list

---

## 🛡️ Step 3: Configure Branch Protection (3 min)

1. [ ] Go to GitHub: **Settings → Branches**
2. [ ] Click **Add rule**
3. [ ] Set:
   - [ ] **Branch name pattern**: `main`

### Require status checks to pass

- [ ] ✅ Require status checks to pass before merging
- [ ] Select: `lint-and-test`
- [ ] Select: `security-audit`
- [ ] Select: `build`

### Require code reviews

- [ ] ✅ Require a pull request before merging
- [ ] ✅ Require code reviews (minimum 1)
- [ ] ✅ Dismiss stale pull request approvals when new commits are pushed
- [ ] ✅ Require branches to be up to date before merging

### Additional protections

- [ ] ✅ Include administrators (so you follow the same rules)

4. [ ] Click **Create**

---

## 🧪 Step 4: Test the Setup (5 min)

### Test 1: CI Pipeline

```bash
# Create and push a test commit
git commit --allow-empty -m "test: trigger CI pipeline"
git push origin main
```

- [ ] Check **GitHub → Actions** tab
- [ ] Watch `CI Pipeline` workflow run
- [ ] Expected jobs: lint-and-test, security-audit, build, etc.
- [ ] All jobs should pass ✅

### Test 2: Deploy Pipeline (after CI passes)

After CI pipeline completes successfully:

- [ ] Check **GitHub → Actions** tab again
- [ ] Watch `Deploy to Production` workflow run
- [ ] Expected jobs: database-migration, deploy-vercel, smoke-test
- [ ] All jobs should pass ✅

### Test 3: Verify Deployment

```bash
# Check if app is deployed
curl https://your-vercel-url.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": "✓",
    "environment": "✓"
  }
}
```

- [ ] Health endpoint returns 200 OK
- [ ] App is live on Vercel

---

## 📊 Step 5: Verify Everything Works

### GitHub Actions

- [ ] [ ] Go to **Actions** tab
- [ ] [ ] See 2 workflows: `CI Pipeline` and `Deploy to Production`
- [ ] [ ] Both have green checkmarks ✅

### Vercel

- [ ] [ ] Go to [Vercel Dashboard](https://vercel.com)
- [ ] [ ] See new deployment with green checkmark
- [ ] [ ] Click deployment → see build logs
- [ ] [ ] Visit app URL → app loads successfully

### Health Check

- [ ] [ ] Run: `curl <your-url>/health`
- [ ] [ ] Response: `{"status": "healthy", ...}`

---

## 🚀 Step 6: Start Using It!

Now that CI/CD is set up, you can:

### Create a Feature Branch

```bash
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: add my feature"
git push -u origin feature/my-feature
```

### Create a Pull Request

- [ ] Go to GitHub
- [ ] Click **Create Pull Request**
- [ ] CI pipeline runs automatically ✅
- [ ] Review & fix any failures (if any)

### Merge to Main

```bash
# In GitHub UI: Click "Merge Pull Request"
# Or in terminal:
git checkout main
git merge feature/my-feature
git push origin main
```

- [ ] CI pipeline runs again ✅
- [ ] Deploy pipeline runs automatically ✅
- [ ] App deploys to production 🎉

---

## 📖 Next: Learn More

After setup is complete:

1. [ ] Read **CI-CD_SUMMARY.md** for overview
2. [ ] Read **DEPLOYMENT.md** for comprehensive guide
3. [ ] Review **.github/workflows/ci.yml** to understand CI
4. [ ] Review **.github/workflows/deploy.yml** to understand deploy

---

## 🆘 Troubleshooting

### "CI pipeline failed"

1. [ ] Check **Actions** → failed workflow → job logs
2. [ ] Look for error message
3. [ ] Fix locally:
   ```bash
   npm run lint -- --fix
   npm run type-check
   git add . && git commit -m "fix: resolve CI issues"
   git push
   ```

### "Deploy failed"

1. [ ] Check **Actions → Deploy to Production** logs
2. [ ] Check **Vercel Dashboard** for build logs
3. [ ] Verify environment variables in Vercel
4. [ ] Check database connection if migrations ran

### "Secrets not found"

```bash
# List secrets to verify they're set
gh secret list

# Re-add a secret if needed
gh secret set VERCEL_TOKEN
# (Paste token, then Ctrl+D)
```

### "Health check times out"

1. [ ] Verify app deployed successfully
2. [ ] Check Vercel logs for runtime errors
3. [ ] Verify `/health` endpoint exists
4. [ ] Wait 30+ seconds after deployment

---

## ✨ You're Done!

Congratulations! Your project now has:

✅ Automated CI/CD pipeline
✅ Branch protection
✅ Automatic testing
✅ Security checks
✅ Production deployments
✅ Auto-rollback on failure
✅ Health monitoring

**Start pushing features with confidence!** 🚀

---

## 📞 Questions?

- **CI/CD not working?** Check `.github/workflows/` files
- **Deployment not working?** Check Vercel dashboard
- **Secrets issues?** Run `gh secret list`
- **Need help?** Read `DEPLOYMENT.md` for detailed guide
