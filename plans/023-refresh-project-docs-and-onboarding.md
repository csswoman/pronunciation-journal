# Plan 023: Refresh README and onboarding docs to match the current Next 16, pnpm, Supabase, Dexie app

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 0e25aca..HEAD -- README.md CLAUDE.md PRODUCT.md package.json .env.example docs`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `0e25aca`, 2026-06-21

## Why this matters

The README still describes an older, simpler app. The actual project now uses
Next 16, React 19, pnpm 11, Supabase, Dexie, Gemini, Vitest, offline sync, and a
fairly strict architecture. Stale onboarding docs slow down human work and make
agent execution less reliable.

## Current state

- `package.json` identifies the current stack and commands:

```json
# package.json:5-13
"scripts": {
  "dev": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev",
  "build": "npm run lint:design-tokens && next build",
  "start": "next start",
  "lint": "eslint .",
  "lint:design-tokens": "node scripts/lint-design-tokens.mjs",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
```

- `package.json` requires pnpm and Node 24:

```json
# package.json:56-61
"packageManager": "pnpm@11.6.0",
"engines": {
  "node": "24.x"
}
```

- `README.md` still says install with npm/yarn/pnpm and describes Supabase as
  optional localStorage cloud sync.
- `CLAUDE.md` has more accurate architecture rules, including Supabase access,
  Dexie/Supabase state, Gemini route constraints, and no inline prompts.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:

- `README.md`
- `docs/README.md` if it exists
- `.env.example` only to document variable names, not values
- `plans/README.md`

**Out of scope**:

- Do not change application code.
- Do not edit `.env.local` or include secret values.
- Do not rewrite `CLAUDE.md` except for small factual cross-links if necessary.
- Do not create marketing copy; this is developer onboarding.

## Git workflow

- Branch: `codex/023-refresh-project-docs-onboarding`
- Commit message: `docs: refresh project onboarding`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Rewrite README around the current stack

Update `README.md` so it says:

- app purpose: English pronunciation journal/practice environment;
- stack: Next.js 16 App Router, React 19, Tailwind v4, Supabase, Dexie,
  Gemini API, Zustand, Vitest;
- package manager: pnpm 11;
- runtime: Node 24.x;
- quick start uses only pnpm commands.

Remove npm/yarn alternatives unless the repo explicitly supports them.

**Verify**: `Select-String -Path README.md -Pattern 'npm install|yarn|Next.js 15|localStorage'`
should return no stale onboarding claims unless they are intentionally explained.

### Step 2: Document required and optional environment variables

Use `.env.example` as the source of variable names. In README, document what
each variable is for without copying values:

- Supabase URL/anon key;
- Gemini API key;
- any optional feature flags already present.

Never include `.env.local` values.

**Verify**: visually confirm README includes variable names but no secret values.

### Step 3: Add verification and workflow commands

Document the commands exactly:

- `pnpm dev`
- `pnpm type-check`
- `pnpm lint`
- `pnpm test`
- `pnpm lint:design-tokens`
- `pnpm build`

Mention that local verification should use Node 24.x because `package.json`
requires it.

**Verify**: `pnpm type-check` and `pnpm lint` exit 0.

### Step 4: Link architecture docs instead of duplicating them

README should link to:

- `CLAUDE.md` for contributor/agent rules;
- `ENGINEERING_STANDARDS.md` for architecture patterns;
- `PRODUCT.md` for product direction;
- `docs/README.md` for deeper docs, if present.

Keep README concise.

**Verify**: all linked local files exist.

## Test plan

Docs-only change. Verification is:

- stale claim search;
- `pnpm type-check`;
- `pnpm lint`.

## Done criteria

- [ ] README accurately describes current stack and package manager.
- [ ] README quick start uses pnpm and Node 24.x.
- [ ] Environment variable names are documented without secret values.
- [ ] README links to product and architecture docs.
- [ ] No application code is modified.
- [ ] `pnpm type-check` and `pnpm lint` exit 0.

## STOP conditions

Stop and report if:

- `.env.example` and application code disagree on required variables.
- Updating README requires deciding product positioning beyond `PRODUCT.md`.
- Any secret value appears in documentation.

## Maintenance notes

Keep README as onboarding, not a second architecture manual. Detailed rules
should stay in `CLAUDE.md`, `ENGINEERING_STANDARDS.md`, and `docs/`.
