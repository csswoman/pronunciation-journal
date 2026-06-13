# Plan 003: Rotate all leaked credentials and purge .env.local from git history

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **NOTE: This is an ops runbook, not a code change.** Steps 1–4 (key rotation)
> must be performed by the repository owner in their browser — the executor
> cannot access external consoles. Steps 5–9 are git commands the executor
> runs. Step 10 (force-push) must be confirmed and run by the repository
> owner, because it rewrites shared history on the remote.
>
> **Drift check (run first)**:
> `git ls-files .env.local`
> If this returns the filename (non-empty output), the file is still tracked —
> proceed to Step 5 immediately.
> If this returns empty output, the file is already untracked. Run
> `git log --all --full-history --oneline -- .env.local` next.
> If that also returns empty, no history exists and Steps 5–9 can be skipped.
> Still complete Steps 1–4 (rotate keys) because the finding was reported
> against a state where the file was pushed.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: HIGH
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

`.env.local` was reported as committed and pushed to the remote GitHub
repository. It contains production credentials for at least four services:
Gemini (AI cost/quota), Supabase service-role key (bypasses all RLS — full
database read/write as superuser), Supabase anon key (used in client), and
Notion (integration data). Anyone with repository read access — now or in the
future via git history — can extract these values. Even after the file is
removed from HEAD, the credentials remain readable in git history until a
history rewrite + force-push is performed. All four keys must be rotated
before the purge, or the purge alone does not help (old keys still work).

## Credentials to rotate

The following credential types are present in `.env.local`. Do not reproduce
values here — rotate by type and location only.

| Variable name | Service | Where to rotate |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini / Google Cloud | Google Cloud Console → APIs & Services → Credentials → find the API key → Actions → Regenerate key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (anon/public) | Supabase Dashboard → Project → Settings → API → anon public → Rotate |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (service role) | Supabase Dashboard → Project → Settings → API → service_role → Rotate. **This key bypasses all RLS — treat as highest priority.** |
| `NOTION_API_KEY` | Notion | Notion → Settings & Members → Connections → find your integration → click the integration → Secrets → Generate new secret |

After rotating each key: copy the new value into your local `.env.local` and
confirm the app still starts (`pnpm dev` — verify no "unauthorized" errors in
the terminal).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Check if file is tracked | `git ls-files .env.local` | empty output (file not tracked) |
| Check full history | `git log --all --full-history --oneline -- .env.local` | empty output (no commits touch this file) |
| Install git-filter-repo | `pip install git-filter-repo` | exit 0; `git filter-repo --version` prints a version string |
| Untrack file | `git rm --cached .env.local` | "rm '.env.local'" |
| Verify ignored | `git check-ignore -v .env.local` | prints `.gitignore:NN:.env*.local  .env.local` |
| Type-check | `pnpm type-check` | exit 0, no errors |

## Scope

**In scope**:
- `.env.local` (remove from tracking)
- `.gitignore` (verify `.env*.local` rule; add explicit `.env.local` line only if the wildcard is absent)
- git history rewrite (purge `.env.local` from all branches/tags)

**Out of scope**:
- Any source code changes
- Any other environment files
- Supabase RLS policies (separate concern)

## Steps

### Step 1 (USER action): Rotate `SUPABASE_SERVICE_ROLE_KEY`

The service-role key bypasses all RLS policies and must be rotated first.

Supabase Dashboard → your project → Settings → API → "service_role" row →
click "Rotate". Copy the new value. Update `.env.local` locally.

**Verify**: The app can still call the Supabase admin client without errors
(run `pnpm dev` and visit a page that calls a server action or API route using
the service client).

### Step 2 (USER action): Rotate `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase Dashboard → Settings → API → "anon public" row → Rotate.
Copy the new value. Update `.env.local` and also any Vercel / hosting
environment variable panels where `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set.

**Verify**: The app still loads and unauthenticated pages render without
Supabase errors.

### Step 3 (USER action): Rotate `GEMINI_API_KEY`

Google Cloud Console → APIs & Services → Credentials → find the API key used
by this project → Actions → Regenerate (or delete and create a new one with
the same restrictions). Update `.env.local` and hosting environment variables.

**Verify**: `pnpm dev` → visit a page that calls `/api/gemini` → confirm no
401/403 from the Gemini API in server logs.

### Step 4 (USER action): Rotate `NOTION_API_KEY`

Notion → Settings & Members → Connections → find the integration → Secrets →
Generate new secret. Update `.env.local` and hosting environment variables.

**Verify**: Any Notion-connected functionality still works (check server logs
for 401 errors from Notion's API).

### Step 5: Confirm `.gitignore` covers `.env.local`

Run:
```
grep "env.*local" .gitignore
```

Expected output includes `.env*.local` (or `.env.local` explicitly).

If the pattern is missing, add `.env.local` on its own line in the
"local env files" section (between `# local env files` and `# vercel`).

**Verify**: `git check-ignore -v .env.local` → output ends with `.env.local`

### Step 6: Untrack `.env.local` if it is currently tracked

Run:
```
git ls-files .env.local
```

If output is non-empty (filename printed), run:
```
git rm --cached .env.local
git commit -m "chore(security): stop tracking .env.local"
```

If output is already empty, skip this step.

**Verify**: `git ls-files .env.local` → empty output

### Step 7: Check whether history purge is needed

Run:
```
git log --all --full-history --oneline -- .env.local
```

If output is empty → no history exists, skip Steps 8–10.
If output is non-empty → the file appears in history; continue to Step 8.

### Step 8: Install git-filter-repo

`git-filter-repo` is the recommended tool (pure Python, no Java dependency,
officially recommended by the Git project as a BFG replacement).

```
pip install git-filter-repo
git filter-repo --version
```

**Verify**: version string printed (e.g. `2.x.x`).

STOP if `pip` is not available — use `pip3` or `python3 -m pip install
git-filter-repo`. If neither works, report back.

### Step 9: Purge `.env.local` from all history

**WARNING**: This rewrites every commit that ever touched `.env.local`.
Run from the repo root:

```
git filter-repo --path .env.local --invert-paths --force
```

The `--invert-paths` flag removes (rather than keeps) the named path.
The `--force` flag is required because this is not a fresh clone.

After the command completes, git-filter-repo removes the remote tracking
configuration. Re-add it:

```
git remote add origin <your-remote-URL>
```

Replace `<your-remote-URL>` with the value from `git remote -v` before you
ran the command (e.g. `https://github.com/owner/english-journal.git`).

**Verify**:
```
git log --all --full-history --oneline -- .env.local
```
Expected: empty output.

Also verify the app still type-checks:
```
pnpm type-check
```
Expected: exit 0.

### Step 10 (USER action): Force-push all refs to remote

**This step rewrites the remote's history and cannot be undone without a
backup. It is intentional — the entire purpose of Steps 8–9 is to remove the
secret from the remote history.**

STOP before this step and review:
- Confirm `git log --all --full-history -- .env.local` is empty (Step 9 done).
- If the repo has collaborators with local clones, coordinate with them first —
  their local branches will diverge after this push and they will need to
  re-clone or hard-reset.
- If there are open PRs, GitHub may display broken diff views until the PR
  branches are rebased onto the new history.

When ready, the owner runs:
```
git push origin --force --all
git push origin --force --tags
```

**Verify** (owner checks in GitHub UI): navigate to the commit that previously
added `.env.local` — it should no longer exist. The "Commits" tab should show
a rewritten history with no reference to `.env.local`.

## Test plan

No automated tests apply to this runbook. Manual verification at each step
is the test plan.

## Done criteria

ALL must hold before marking this plan DONE:

- [ ] All four credential types have been rotated in their respective consoles
- [ ] `.env.local` is NOT listed by `git ls-files .env.local` (empty output)
- [ ] `.gitignore` contains `.env*.local` or `.env.local` explicitly
- [ ] `git log --all --full-history --oneline -- .env.local` returns empty
- [ ] `pnpm type-check` exits 0
- [ ] Force-push to remote completed by repo owner
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any key rotation step fails (service returns an error, UI option not found).
- `git filter-repo` is not installable in this environment.
- `git filter-repo --force` exits non-zero or reports errors.
- After the purge, `git log --all --full-history -- .env.local` is still non-empty.
- `pnpm type-check` fails after the purge.
- The repo has collaborators you were not informed about — STOP and have the
  owner coordinate before force-pushing.

## Maintenance notes

- After this lands, set up a GitHub secret-scanning policy (Settings →
  Code security → Secret scanning → Enable) to prevent future commits of
  credentials.
- All four API keys should be stored exclusively in the hosting platform's
  secret store (e.g. Vercel Environment Variables) — never in any committed
  file, including files that appear in `.gitignore` on a feature branch.
- The `.env*.local` pattern in `.gitignore` covers `.env.local`,
  `.env.development.local`, etc.
